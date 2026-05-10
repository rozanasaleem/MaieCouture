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

    public OrderService(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            ShippingService shippingService,
            OrderNotificationService orderNotificationService
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.shippingService = shippingService;
        this.orderNotificationService = orderNotificationService;
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
        order.setNotes(request.notes());

        List<OrderItem> items = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;
        String orderCurrency = null;

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
            if (orderCurrency == null) {
                orderCurrency = productCurrency;
            } else if (!orderCurrency.equals(productCurrency)) {
                throw new IllegalArgumentException(
                        "All items in one order must use the same currency. Found: " + orderCurrency + " and " + productCurrency
                );
            }

            item.setUnitPrice(unitPrice);
            item.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(line.quantity())));
            items.add(item);

            totalAmount = totalAmount.add(item.getLineTotal());
            decrementStock(item.getVariant(), line.quantity(), product);
            product.touch();
        }

        order.setCurrency(orderCurrency != null ? orderCurrency : "NIS");
        BigDecimal subtotalAmount = totalAmount.setScale(2, RoundingMode.HALF_UP);
        BigDecimal shippingFee = shippingService.calculateFee(request.shippingCountryCode());
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
        if (currency == null || currency.isBlank()) {
            return "NIS";
        }
        String code = currency.trim().toUpperCase();
        if (code.equals("NIS") || code.equals("ILS")) {
            return "NIS";
        }
        return code;
    }
}
