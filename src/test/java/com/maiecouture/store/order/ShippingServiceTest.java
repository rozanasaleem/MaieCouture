package com.maiecouture.store.order;

import com.maiecouture.store.config.ShippingProperties;
import com.maiecouture.store.product.Product;
import com.maiecouture.store.product.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class ShippingServiceTest {
    private final ProductRepository products = mock(ProductRepository.class);
    private ShippingService shipping;

    @BeforeEach void setup() {
        var properties = new ShippingProperties("PS", money("5"), money("25"), money("50"), money("75"),
                money("25"), money("15"), Map.of("JO", money("20"), "AE", money("25")));
        shipping = new ShippingService(properties,
                new CurrencyConversionService(money("3.05"), money("3.45"), money("4.25")), products);
        product("Shoes");
    }

    private void product(String name) {
        var product = new Product();
        product.setName(name);
        when(products.findById(1L)).thenReturn(Optional.of(product));
    }

    private BigDecimal quote(String country, String region, int quantity) {
        return shipping.calculateFee(country, region, "ILS", List.of(new ShippingService.ShippingLine(1L, quantity)));
    }

    private static BigDecimal money(String amount) { return new BigDecimal(amount); }

    @ParameterizedTest
    @CsvSource({"IL", "CD", "GQ", "AX", "BQ", "CW", "SX", "ZZ"})
    void rejectsDestinationsNotInTheSuppliedPaper(String country) {
        assertThrows(IllegalArgumentException.class, () -> quote(country, null, 1));
    }

    @ParameterizedTest
    @CsvSource({"JO,105", "AE,105", "SA,105", "QA,105", "US,105", "CA,105", "NZ,115", "IQ,165",
            "SY,115", "SZ,115", "LI,115", "CN,140", "HK,140", "KP,160", "PW,160", "MN,160", "VI,160",
            "AD,170", "BW,170", "SC,170", "SL,170", "WF,170", "EH,170", "ZM,170", "ZW,170", "VG,170",
            "TO,180", "GS,180", "SH,180", "KN,180", "LC,180", "PM,180", "VC,180", "RE,180", "BV,180",
            "GU,200", "SS,200", "LY,200", "MK,200", "CO,200", "MG,180"})
    void countryZonesAndSurchargeMatchSuppliedSheets(String country, String expected) {
        assertEquals(money(expected).setScale(2), quote(country, null, 1));
    }

    @ParameterizedTest
    @CsvSource({"GB,Scotland,140", "GB,Wales,170", "GB,Northern Ireland,200", "GB,England,115",
            "ES,Canary Islands,170", "PT,Madeira,200", "PT,Lisbon,115", "US,Wales,105"})
    void regionExceptionsOnlyApplyWithinTheirCountry(String country, String region, String expected) {
        assertEquals(money(expected).setScale(2), quote(country, region, 1));
    }

    @ParameterizedTest
    @CsvSource({"1,0.5,85", "1,0.5001,105", "1,1,105", "1,1.0001,130", "1,10,380", "1,10.0001,390",
            "2,10.5,555", "3,10.5,578", "4,10.5,580", "5,10.5,728", "6,10.5,735", "7,10.5,758"})
    void roundsUpToHalfKilogramAndExtendsAboveTenKg(int zone, String kg, String expected) {
        assertEquals(money(expected).setScale(2), ShippingService.rateForWeight(zone, money(kg)));
    }

    @Test void volumetricWeightOfStandardBoxDeterminesThreeKgBracket() {
        product("Soap");
        assertEquals(money("200.00"), quote("JO", null, 1));
    }

    @Test void quantityAndPackagingCanExceedVolumetricWeight() {
        product("Soap");
        assertEquals(money("430.00"), quote("JO", null, 100));
    }

    @ParameterizedTest
    @CsvSource({"WEST_BANK,25", "JERUSALEM,50", "AREAS_48,75"})
    void domesticDeliveryRetainsLocalFees(String area, String expected) {
        assertEquals(money(expected).setScale(2), quote("PS", area, 1));
    }
}
