package com.stockpro.purchase.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PurchaseAlertScheduler {

  private final PurchaseService purchaseService;

  @Scheduled(cron = "${purchase.alert.overdue.cron:0 0 9 * * *}")
  public void dispatchOverdueReceiptAlerts() {
    try {
      purchaseService.dispatchOverdueReceiptAlerts();
    } catch (Exception ex) {
      log.warn("Overdue receipt alert scheduler failed: {}", ex.getMessage());
    }
  }
}
