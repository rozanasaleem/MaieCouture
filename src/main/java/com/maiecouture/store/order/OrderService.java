package com.maiecouture.store.order;

import com.maiecouture.store.common.ResourceNotFoundException;
import com.maiecouture.store.notification.OrderNotificationService;
import com.maiecouture.store.product.Product;
import com.maiecouture.store.product.ProductRepository;
import com.maiecouture.store.product.ProductStatus;
import com.maiecouture.store.product.ProductVariant;
import com.maiecouture.store.product.PurchaseType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ShippingService shippingService;
    private final OrderNotificationService orderNotificationService;
    private final CurrencyConversionService currencyConversionService;

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            ShippingService shippingService,
            OrderNotificationService orderNotificationService,
            CurrencyConversionService currencyConversionService
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.shippingService = shippingService;
        this.orderNotificationService = orderNotificationService;
        this.currencyConversionService = currencyConversionService;
    }

    public List<OrderResponse> getOrders() {
        return orderRepository.findAll().stream()
                .map(OrderResponse::from)
                .toList();
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setOrderStatus(OrderStatus.PENDING);
        order.setPaymentStatus(PaymentStatus.PENDING);
        order.setCustomerName(request.customerName());
        order.setEmail(request.email());
        order.setPhone(request.phone());
        order.setShippingAddress(request.shippingAddress());
        order.setShippingCountryCode(normalizeCountryCode(request.shippingCountryCode()));
        order.setShippingAreaCode(normalizeShippingAreaCode(order.getShippingCountryCode(), request.shippingAreaCode()));
        order.setNotes(request.notes());
        String orderCurrency = currencyConversionService.normalizeCurrency(request.currency());

        List<OrderItem> items = new ArrayList<>();
        List<ShippingService.ShippingLine> shippingLines = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        for (CreateOrderRequest.OrderLineRequest line : request.items()) {
            Product product = productRepository.findById(line.productId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + line.productId()));

            if (!product.isPublished() || !product.isAvailable()) {
                throw new IllegalArgumentException("Product is not available: " + product.getName());
            }

            if (product.getPurchaseType() != PurchaseType.DIRECT_PURCHASE) {
                throw new IllegalArgumentException("Product is not available for direct purchase: " + product.getName());
            }

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProduct(product);
            item.setProductName(product.getName());
            item.setQuantity(line.quantity());
            item.setVariant(resolveVariant(line.variantId(), product));

            BigDecimal unitPrice = product.getSalePrice() != null ? product.getSalePrice() : product.getPrice();
            if (unitPrice == null) {
                throw new IllegalArgumentException("Product is missing a price: " + product.getName());
            }

            String productCurrency = normalizeCurrency(product.getCurrency());
            BigDecimal convertedUnitPrice = currencyConversionService.convert(unitPrice, productCurrency, orderCurrency);

            item.setUnitPrice(convertedUnitPrice);
            item.setLineTotal(convertedUnitPrice.multiply(BigDecimal.valueOf(line.quantity())).setScale(2, RoundingMode.HALF_UP));
            items.add(item);

            totalAmount = totalAmount.add(item.getLineTotal());
            shippingLines.add(new ShippingService.ShippingLine(product.getId(), line.quantity()));
            decrementStock(item.getVariant(), line.quantity(), product);
            product.touch();
        }

        order.setCurrency(orderCurrency);
        BigDecimal subtotalAmount = totalAmount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal shippingFee = shippingService.calculateFee(
                order.getShippingCountryCode(),
                order.getShippingAreaCode(),
                orderCurrency,
                shippingLines
        );
        order.setSubtotalAmount(subtotalAmount);
        order.setShippingFee(shippingFee);
        order.setTotalAmount(subtotalAmount.add(shippingFee).setScale(2, RoundingMode.HALF_UP));
        order.setItems(items);
        order.touch();

        Order saved = orderRepository.save(order);
        orderNotificationService.sendOrderReceived(saved);
        return OrderResponse.from(saved);
    }

    @Transactional
    public OrderResponse updateStatus(Long orderId, UpdateOrderStatusRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        PaymentStatus previousPaymentStatus = order.getPaymentStatus();
        OrderStatus previousOrderStatus = order.getOrderStatus();
        order.setOrderStatus(request.orderStatus());
        if (request.paymentStatus() != null) {
            order.setPaymentStatus(request.paymentStatus());
        }
        order.touch();
        Order saved = orderRepository.save(order);

        if (previousPaymentStatus != PaymentStatus.PAID && saved.getPaymentStatus() == PaymentStatus.PAID) {
            orderNotificationService.sendPaymentConfirmed(saved);
        }
        if (previousOrderStatus != OrderStatus.SHIPPED && saved.getOrderStatus() == OrderStatus.SHIPPED) {
            orderNotificationService.sendShipped(saved);
        }

        return OrderResponse.from(saved);
    }

    private ProductVariant resolveVariant(Long variantId, Product product) {
        if (variantId == null) {
            return null;
        }
        return product.getVariants().stream()
                .filter(variant -> variant.getId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Variant does not belong to product: " + product.getName()));
    }

    private void decrementStock(ProductVariant variant, Integer quantity, Product product) {
        if (variant == null || variant.isMadeToOrder()) {
            return;
        }
        // Stock is enforced only for explicitly limited drops.
        if (product.getProductStatus() != ProductStatus.LIMITED) {
            return;
        }
        if (variant.getStockQuantity() < quantity) {
            throw new IllegalArgumentException("Insufficient stock for product variant: " + product.getName());
        }
        variant.setStockQuantity(variant.getStockQuantity() - quantity);
    }

    private String generateOrderNumber() {
        return "MC-" + LocalDate.now().getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String normalizeCountryCode(String countryCode) {
        if (countryCode == null || countryCode.isBlank()) {
            return null;
        }
        return countryCode.trim().toUpperCase();
    }

    private String normalizeCurrency(String currency) {
        return currencyConversionService.normalizeCurrency(currency);
    }

    private String normalizeShippingAreaCode(String countryCode, String shippingAreaCode) {
        if (!"PS".equals(countryCode)) {
            if (shippingAreaCode == null) return null;
            String area = shippingAreaCode.trim().toUpperCase(java.util.Locale.ROOT).replace('-', '_').replace(' ', '_');
            return java.util.Set.of("SCOTLAND", "GB_SCT", "WALES", "GB_WLS", "NORTHERN_IRELAND", "GB_NIR",
                    "CANARY_ISLANDS", "ES_CN", "MADEIRA", "PT_30").contains(area) ? area : null;
        }
        if (shippingAreaCode == null || shippingAreaCode.isBlank()) {
            return "WEST_BANK";
        }

        return switch (shippingAreaCode.trim().toUpperCase()) {
            case "JERUSALEM" -> "JERUSALEM";
            case "AREAS_48" -> "AREAS_48";
            case "WEST_BANK" -> "WEST_BANK";
            default -> "WEST_BANK";
        };
    }
}
