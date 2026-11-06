package com.maiecouture.store.order;

import com.maiecouture.store.config.ShippingProperties;
import com.maiecouture.store.product.Product;
import com.maiecouture.store.product.ProductRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ShippingService {

    private static final Set<String> SUPPORTED_COUNTRIES = loadSupportedCountries();

    private static Set<String> loadSupportedCountries() {
        try (var input = ShippingService.class.getResourceAsStream("/shipping-countries.json")) {
            if (input == null) throw new IllegalStateException("Shipping country list is missing");
            return Set.of(new com.fasterxml.jackson.databind.ObjectMapper().readValue(input, String[].class));
        } catch (java.io.IOException exception) {
            throw new IllegalStateException("Unable to load shipping country list", exception);
        }
    }

    private static final String WEST_BANK = "WEST_BANK";
    private static final String JERUSALEM = "JERUSALEM";
    private static final String AREAS_48 = "AREAS_48";
    private static final BigDecimal PACKAGING_WEIGHT_KG = new BigDecimal("0.302");
    private static final BigDecimal STANDARD_PARCEL_VOLUMETRIC_KG = volumetricWeightKg(30, 40.5, 11);
    private static final BigDecimal SHOES_PARCEL_VOLUMETRIC_KG = volumetricWeightKg(10, 17, 29);
    private static final int[][] ARAMEX_RATES = {
            {85, 100, 110, 130, 140, 150, 170},
            {105, 115, 140, 160, 170, 180, 200},
            {130, 130, 170, 190, 200, 210, 230},
            {155, 160, 200, 220, 230, 240, 260},
            {175, 190, 230, 250, 260, 270, 290},
            {200, 220, 260, 280, 290, 300, 320},
            {210, 240, 290, 310, 320, 330, 350},
            {235, 265, 320, 340, 350, 360, 380},
            {250, 290, 350, 370, 380, 390, 410},
            {260, 310, 380, 400, 410, 420, 440},
            {270, 335, 398, 430, 440, 450, 470},
            {280, 360, 416, 445, 470, 480, 500},
            {295, 380, 434, 460, 500, 510, 530},
            {315, 405, 452, 475, 530, 540, 560},
            {335, 425, 470, 490, 560, 570, 590},
            {350, 445, 488, 505, 590, 600, 620},
            {360, 480, 506, 520, 620, 630, 650},
            {365, 505, 524, 535, 650, 660, 680},
            {370, 525, 542, 550, 680, 690, 710},
            {380, 540, 560, 565, 710, 720, 740}
    };
    private static final int[] ARAMEX_ADDITIONAL_HALF_KG_RATES = {10, 15, 18, 15, 18, 15, 18};
    private static final Set<String> ZONE_1_COUNTRIES = Set.of(
            "BH", "CA", "CY", "EG", "JO", "KW", "LB", "OM", "QA", "SA", "AE", "US"
    );
    private static final Set<String> ZONE_2_COUNTRIES = Set.of(
            "AT", "BE", "DK", "FI", "FR", "DE", "GR", "IE", "IT", "LU", "MC", "NL", "NO",
            "PT", "ES", "SE", "CH", "TR", "GB", "VA", "IQ", "NZ", "SZ", "SY", "LI"
    );
    private static final Set<String> ZONE_3_COUNTRIES = Set.of("HK", "SG", "TZ", "YE", "CN");
    private static final Set<String> ZONE_4_COUNTRIES = Set.of(
            "BD", "BN", "BT", "KH", "IN", "ID", "JP", "KR", "LA", "MO", "MY", "MV",
            "NP", "PK", "PH", "LK", "TH", "TW", "VN", "KP", "PW", "MN", "VI"
    );
    private static final Set<String> ZONE_5_COUNTRIES = Set.of(
            "AL", "AM", "AU", "AZ", "BY", "BG", "HR", "CZ", "EE", "FO", "GE", "GI", "GL",
            "GG", "HU", "IS", "JE", "KZ", "KG", "LV", "LT", "MT", "MD", "ME", "PL",
            "RO", "RU", "SM", "RS", "SK", "SI", "TT", "UA", "UZ", "AD", "BW", "SC",
            "SL", "WF", "EH", "ZM", "ZW", "VG"
    );
    private static final Set<String> ZONE_6_COUNTRIES = Set.of(
            "DZ", "AO", "BJ", "BF", "BI", "CM", "CV", "CF", "TD", "KM", "CG", "CI",
            "DJ", "ER", "ET", "GA", "GM", "GH", "GN", "GW", "KE", "LS", "LR", "MW", "ML",
            "MR", "MU", "YT", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN",
            "SO", "ZA", "SD", "TJ", "TG", "TN", "UG", "BV", "SH", "KN", "LC", "PM",
            "VC", "RE", "TO", "GS", "MG"
    );

    private final ShippingProperties shippingProperties;
    private final CurrencyConversionService currencyConversionService;
    private final ProductRepository productRepository;

    public ShippingService(
            ShippingProperties shippingProperties,
            CurrencyConversionService currencyConversionService,
            ProductRepository productRepository
    ) {
        this.shippingProperties = shippingProperties;
        this.currencyConversionService = currencyConversionService;
        this.productRepository = productRepository;
    }

    public BigDecimal calculateFee(String shippingCountryCode) {
        return calculateFee(shippingCountryCode, "ILS");
    }

    public BigDecimal calculateFee(String shippingCountryCode, String currency) {
        return calculateFee(shippingCountryCode, null, currency);
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateFee(String shippingCountryCode, String shippingAreaCode, String currency) {
        return calculateFee(shippingCountryCode, shippingAreaCode, currency, List.of());
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateFee(
            String shippingCountryCode,
            String shippingAreaCode,
            String currency,
            List<ShippingLine> items
    ) {
        BigDecimal baseFee = calculateBaseFee(shippingCountryCode, shippingAreaCode, items);
        return currencyConversionService.convert(baseFee, "ILS", currency);
    }

    private BigDecimal calculateBaseFee(String shippingCountryCode, String shippingAreaCode, List<ShippingLine> items) {
        if (shippingCountryCode == null || shippingCountryCode.isBlank()) {
            return scale(shippingProperties.fallbackFee());
        }

        String code = shippingCountryCode.trim().toUpperCase();
        if (!SUPPORTED_COUNTRIES.contains(code)) {
            throw new IllegalArgumentException("Shipping is not available for this country");
        }
        if (code.equalsIgnoreCase(shippingProperties.domesticCountryCode())) {
            return calculateDomesticFee(shippingAreaCode);
        }

        BigDecimal fee = calculateInternationalFee(code, shippingAreaCode, items);
        return "IQ".equals(code) ? fee.add(new BigDecimal("50.00")) : fee;
    }

    private BigDecimal calculateDomesticFee(String shippingAreaCode) {
        if (shippingAreaCode == null || shippingAreaCode.isBlank()) {
            return scale(firstPresent(shippingProperties.westBankFee(), shippingProperties.domesticFee()));
        }

        return switch (shippingAreaCode.trim().toUpperCase()) {
            case JERUSALEM -> scale(firstPresent(shippingProperties.jerusalemFee(), shippingProperties.domesticFee()));
            case AREAS_48 -> scale(firstPresent(shippingProperties.areas48Fee(), shippingProperties.domesticFee()));
            case WEST_BANK -> scale(firstPresent(shippingProperties.westBankFee(), shippingProperties.domesticFee()));
            default -> scale(firstPresent(shippingProperties.westBankFee(), shippingProperties.domesticFee()));
        };
    }

    private BigDecimal firstPresent(BigDecimal preferred, BigDecimal fallback) {
        return preferred != null ? preferred : fallback;
    }

    private BigDecimal calculateInternationalFee(String countryCode, String region, List<ShippingLine> items) {
        int zone = zoneForDestination(countryCode, region);
        BigDecimal chargeableWeight = calculateChargeableWeight(items);
        return rateForWeight(zone, chargeableWeight);
    }

    static BigDecimal rateForWeight(int zone, BigDecimal chargeableWeight) {
        int halfKgUnits = Math.max(1, chargeableWeight.multiply(BigDecimal.valueOf(2))
                .setScale(0, RoundingMode.CEILING)
                .intValue());

        if (halfKgUnits <= 20) {
            return BigDecimal.valueOf(ARAMEX_RATES[halfKgUnits - 1][zone - 1]).setScale(2, RoundingMode.HALF_UP);
        }

        int extraHalfKgUnits = halfKgUnits - 20;
        int fee = ARAMEX_RATES[19][zone - 1] + (extraHalfKgUnits * ARAMEX_ADDITIONAL_HALF_KG_RATES[zone - 1]);
        return BigDecimal.valueOf(fee).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateChargeableWeight(List<ShippingLine> items) {
        List<ShippingLine> safeItems = items == null ? List.of() : items;
        boolean shoesOnly = !safeItems.isEmpty() && safeItems.stream()
                .allMatch(line -> productRepository.findById(line.productId())
                        .map(this::isShoes)
                        .orElse(false));

        BigDecimal actualWeight = PACKAGING_WEIGHT_KG;
        for (ShippingLine line : safeItems) {
            Product product = productRepository.findById(line.productId()).orElse(null);
            BigDecimal productWeight = product == null ? BigDecimal.ONE : estimateProductWeight(product);
            actualWeight = actualWeight.add(productWeight.multiply(BigDecimal.valueOf(Math.max(1, line.quantity()))));
        }

        BigDecimal volumetricWeight = shoesOnly ? SHOES_PARCEL_VOLUMETRIC_KG : STANDARD_PARCEL_VOLUMETRIC_KG;
        return actualWeight.max(volumetricWeight).max(BigDecimal.ONE);
    }

    private BigDecimal estimateProductWeight(Product product) {
        String text = productText(product);
        BigDecimal baseWeight;

        if (text.contains("soap")) {
            baseWeight = new BigDecimal("0.12");
        } else if (isShoes(product)) {
            baseWeight = new BigDecimal("0.45");
        } else if (text.contains("bag") || text.contains("clutch")) {
            baseWeight = new BigDecimal("0.70");
        } else if (text.contains("shawl") || text.contains("scarf")) {
            baseWeight = new BigDecimal("0.50");
        } else if (text.contains("vest")) {
            baseWeight = new BigDecimal("0.35");
        } else if (text.contains("blazer")) {
            baseWeight = new BigDecimal("0.75");
        } else if (text.contains("jumpsuit")) {
            baseWeight = BigDecimal.ONE;
        } else if (text.contains("abaya")) {
            baseWeight = BigDecimal.ONE;
        } else if (text.contains("thobe") || text.contains("traditional")) {
            baseWeight = new BigDecimal("2.50");
        } else if (text.contains("dress") || text.contains("bridal") || text.contains("evening")) {
            baseWeight = new BigDecimal("1.50");
        } else {
            baseWeight = BigDecimal.ONE;
        }

        return text.contains("train") ? baseWeight.add(BigDecimal.ONE) : baseWeight;
    }

    private boolean isShoes(Product product) {
        String text = productText(product);
        return text.contains("shoe");
    }

    private String productText(Product product) {
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "";
        String categorySlug = product.getCategory() != null ? product.getCategory().getSlug() : "";
        return String.join(" ",
                        safe(product.getName()),
                        safe(product.getSlug()),
                        safe(product.getShortDescription()),
                        safe(product.getFullDescription()),
                        safe(categoryName),
                        safe(categorySlug))
                .toLowerCase();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private int zoneForCountry(String countryCode) {
        if (ZONE_1_COUNTRIES.contains(countryCode)) {
            return 1;
        }
        if (ZONE_2_COUNTRIES.contains(countryCode)) {
            return 2;
        }
        if (ZONE_3_COUNTRIES.contains(countryCode)) {
            return 3;
        }
        if (ZONE_4_COUNTRIES.contains(countryCode)) {
            return 4;
        }
        if (ZONE_5_COUNTRIES.contains(countryCode)) {
            return 5;
        }
        if (ZONE_6_COUNTRIES.contains(countryCode)) {
            return 6;
        }
        return 7;
    }

    private int zoneForDestination(String countryCode, String region) {
        String area = region == null ? "" : region.trim().toUpperCase(java.util.Locale.ROOT).replace('-', '_').replace(' ', '_');
        if ("GB".equals(countryCode)) {
            if (Set.of("SCOTLAND", "GB_SCT").contains(area)) return 3;
            if (Set.of("WALES", "GB_WLS").contains(area)) return 5;
            if (Set.of("NORTHERN_IRELAND", "GB_NIR").contains(area)) return 7;
        }
        if ("ES".equals(countryCode) && Set.of("CANARY_ISLANDS", "ES_CN").contains(area)) return 5;
        if ("PT".equals(countryCode) && Set.of("MADEIRA", "PT_30").contains(area)) return 7;
        return zoneForCountry(countryCode);
    }

    private static BigDecimal volumetricWeightKg(double lengthCm, double widthCm, double heightCm) {
        return BigDecimal.valueOf(lengthCm)
                .multiply(BigDecimal.valueOf(widthCm))
                .multiply(BigDecimal.valueOf(heightCm))
                .divide(BigDecimal.valueOf(5000), 3, RoundingMode.CEILING);
    }

    private BigDecimal scale(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP);
    }

    public record ShippingLine(Long productId, Integer quantity) {
    }
}
