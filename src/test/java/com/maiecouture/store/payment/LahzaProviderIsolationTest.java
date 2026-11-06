package com.maiecouture.store.payment;

import com.maiecouture.store.config.LahzaProperties;
import com.maiecouture.store.notification.OrderNotificationService;
import com.maiecouture.store.order.Order;
import com.maiecouture.store.order.OrderRepository;
import com.maiecouture.store.order.PaymentStatus;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class LahzaProviderIsolationTest {
    @Test void lahzaMockVerificationCannotPayACyberSourceOrder() {
        var repository = mock(OrderRepository.class);
        var order = new Order();
        order.setPaymentProvider("CYBERSOURCE");
        when(repository.findByPaymentReference("cybs-ref")).thenReturn(Optional.of(order));
        var service = new LahzaPaymentService(repository, new LahzaProperties(false, null, null, null), mock(OrderNotificationService.class));
        assertThrows(IllegalArgumentException.class, () -> service.verifyByReference("cybs-ref"));
        assertEquals(PaymentStatus.PENDING, order.getPaymentStatus());
        verify(repository, never()).save(any());
    }
}
