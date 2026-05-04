require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

class WhatsAppNotifier {
  
  /**
   * Format Nigerian phone number for WhatsApp
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  static formatNigerianNumber(phone) {
    const clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) return '234' + clean.slice(1);
    if (clean.startsWith('234')) return clean;
    return '234' + clean;
  }
  
  /**
   * Format Naira amount with thousand separators
   * @param {number} amount - Amount in Naira
   * @returns {string} Formatted amount
   */
  static formatNaira(amount) {
    return '₦' + Number(amount).toLocaleString('en-NG');
  }
  
  /**
   * Generate WhatsApp URL with message
   * @param {string} phoneNumber - Recipient phone number
   * @param {string} message - Message content
   * @returns {string} WhatsApp URL
   */
  static generateWhatsAppURL(phoneNumber, message) {
    const formattedPhone = this.formatNigerianNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  }
  
  /**
   * Generate host notification for new booking
   * @param {Object} booking - Booking object
   * @param {Object} apartment - Apartment object
   * @returns {string} WhatsApp URL for host notification
   */
  static generateHostNotification(booking, apartment) {
    const message = `Apartment: ${apartment.name}
Guest: ${booking.guestName}
Phone: ${booking.guestPhone}
Email: ${booking.guestEmail}
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.numGuests}
Total: ${this.formatNaira(booking.totalPrice)}
Booking ID: #${booking.id}`;

    return this.generateWhatsAppURL(process.env.HOST_WHATSAPP_NUMBER, message);
  }
  
  /**
   * Generate guest payment instructions
   * @param {Object} booking - Booking object
   * @param {Object} apartment - Apartment object
   * @returns {string} WhatsApp URL for guest payment instructions
   */
  static generateGuestPaymentLink(booking, apartment) {
    const message = `🎉 Booking Confirmed — Lekki Stays

Hi ${booking.guestName}! Your booking has been confirmed.

📋 Booking Details:
Apartment: ${apartment.name}
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.numGuests}
Booking ID: #${booking.id}

💰 Payment Required: ${this.formatNaira(booking.totalPrice)}
Please make a bank transfer to:

Bank: ${process.env.BANK_NAME}
Account Number: ${process.env.BANK_ACCOUNT_NUMBER}
Account Name: ${process.env.BANK_ACCOUNT_NAME}
Amount: ${this.formatNaira(booking.totalPrice)}
Reference: LEKKI-#${booking.id}

📸 After payment, send your receipt screenshot as a reply to this WhatsApp message to confirm your reservation.

⏰ Payment must be received within 24 hours or your reservation may be released.

We look forward to hosting you! 🏠
Lekki Stays Team`;

    return this.generateWhatsAppURL(booking.guestPhone, message);
  }
  
  /**
   * Generate guest decline notification
   * @param {Object} booking - Booking object
   * @param {Object} apartment - Apartment object
   * @returns {string} WhatsApp URL for guest decline notification
   */
  static generateGuestDeclineLink(booking, apartment) {
    const message = `😔 Booking Update — Lekki Stays

Hi ${booking.guestName}, unfortunately your booking request for ${apartment.name} from ${booking.checkIn} to ${booking.checkOut} could not be confirmed at this time.

Please visit our website to check other available dates or apartments. We hope to host you soon!

lekkistays.com`;

    return this.generateWhatsAppURL(booking.guestPhone, message);
  }
  
  /**
   * Generate host cancellation alert
   * @param {Object} booking - Booking object
   * @param {Object} apartment - Apartment object
   * @param {boolean} refundEligible - Whether refund is eligible
   * @returns {string} WhatsApp URL for host cancellation alert
   */
  static generateHostCancellationAlert(booking, apartment, refundEligible) {
    const refundStatus = refundEligible 
      ? `FULL REFUND ELIGIBLE — please refund ${this.formatNaira(booking.totalPrice)} to guest manually`
      : `NO REFUND — cancelled within 48 hours of check-in`;
    
    const message = `🚫 BOOKING CANCELLED — Lekki Stays

Booking #${booking.id} has been cancelled by the guest.

Apartment: ${apartment.name}
Guest: ${booking.guestName}
Phone: ${booking.guestPhone}
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Total: ${this.formatNaira(booking.totalPrice)}

💰 Refund Status: ${refundStatus}

📅 Those dates are now available for new bookings.`;

    return this.generateWhatsAppURL(process.env.HOST_WHATSAPP_NUMBER, message);
  }
  
  /**
   * Generate guest cancel confirmation link (for guest to contact host)
   * @param {Object} booking - Booking object
   * @returns {string} WhatsApp URL for guest to contact host
   */
  static generateGuestCancelConfirmLink(booking) {
    const refundText = booking.isRefundable() 
      ? `I would like to follow up on my refund of ${this.formatNaira(booking.getRefundAmount())}.`
      : '';
    
    const message = `Hi Lekki Stays, I just cancelled booking #${booking.id}. ${refundText} Please confirm. Thank you.`;

    return this.generateWhatsAppURL(process.env.HOST_WHATSAPP_NUMBER, message);
  }
  
  /**
   * Generate HTML page for booking confirmation
   * @param {Object} booking - Booking object
   * @param {Object} apartment - Apartment object
   * @param {string} guestPaymentLink - WhatsApp link for guest payment
   * @returns {string} HTML page content
   */
  static generateConfirmationPage(booking, apartment, guestPaymentLink) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Booking Confirmed - Lekki Stays</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a; color: #F5F0E8;
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111; border-radius: 16px;
      padding: 48px 40px; max-width: 480px;
      width: 100%; text-align: center;
      border: 1px solid #C9A96E;
    }
    h1 { 
      font-family: 'Cormorant Garamond', serif; 
      font-size: 32px; margin-bottom: 12px; 
      color: #C9A96E;
    }
    p { color: #888; font-size: 15px; line-height: 1.6; margin-bottom: 8px; }
    .amount { 
      font-family: 'Cormorant Garamond', serif; 
      font-size: 36px; color: #C9A96E; font-weight: 700; 
    }
    .info-box { 
      background: #1a1a1a; border-radius: 8px; 
      padding: 20px; margin: 20px 0; text-align: left; 
    }
    .info-row { 
      display: flex; justify-content: space-between; 
      padding: 6px 0; border-bottom: 1px solid #2a2a2a; 
      font-size: 14px; 
    }
    .info-row:last-child { border-bottom: none; }
    .label { color: #888; }
    .value { color: #F5F0E8; font-weight: 500; }
    .btn-gold {
      display: inline-block; margin-top: 20px; padding: 14px 32px;
      background: #C9A96E; color: #0a0a0a; border-radius: 8px;
      text-decoration: none; font-weight: 700; font-size: 15px;
      transition: background 0.2s ease; width: 100%; text-align: center;
    }
    .btn-gold:hover { background: #8B6914; }
    .payment-box { 
      background: #1a1a1a; border: 1px solid #C9A96E; 
      border-radius: 8px; padding: 20px; margin: 20px 0; 
    }
    .bank-detail { color: #888; font-size: 13px; margin-top: 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
    <h1>Booking Confirmed</h1>
    <p>Booking <strong>#${booking.id}</strong> for <strong>${booking.guestName}</strong> is confirmed.</p>
    
    <div class="payment-box">
      <p class="label" style="font-size:12px; text-transform:uppercase; letter-spacing:1px;">Amount to Collect</p>
      <p class="amount">${this.formatNaira(booking.totalPrice)}</p>
      <p class="bank-detail">${process.env.BANK_ACCOUNT_NAME} · ${process.env.BANK_NAME} · ${process.env.BANK_ACCOUNT_NUMBER}</p>
    </div>
    
    <div class="info-box">
      <div class="info-row"><span class="label">Apartment</span><span class="value">${apartment.name}</span></div>
      <div class="info-row"><span class="label">Guest</span><span class="value">${booking.guestName}</span></div>
      <div class="info-row"><span class="label">Check-in</span><span class="value">${booking.checkIn}</span></div>
      <div class="info-row"><span class="label">Check-out</span><span class="value">${booking.checkOut}</span></div>
      <div class="info-row"><span class="label">Guests</span><span class="value">${booking.numGuests}</span></div>
    </div>
    
    <p style="color:#888; font-size:13px; margin-bottom: 8px;">
      Tap below to send payment details to the guest on WhatsApp.
    </p>
    
    <a href="${guestPaymentLink}" target="_blank" class="btn-gold">
      💬 Send Payment Details to Guest
    </a>
    
    <p style="color:#555; font-size:12px; margin-top:16px;">
      Guest has 24 hours to pay. If no payment received, use your original
      WhatsApp message to cancel and release those dates.
    </p>
  </div>
</body>
</html>`;
  }
  
  /**
   * Generate HTML page for booking decline
   * @param {Object} booking - Booking object
   * @param {Object} apartment - Apartment object
   * @param {string} guestDeclineLink - WhatsApp link for guest decline notification
   * @returns {string} HTML page content
   */
  static generateDeclinePage(booking, apartment, guestDeclineLink) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Booking Declined - Lekki Stays</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a; color: #F5F0E8;
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111; border-radius: 16px;
      padding: 48px 40px; max-width: 480px;
      width: 100%; text-align: center;
      border: 1px solid #E53935;
    }
    h1 { 
      font-family: 'Cormorant Garamond', serif; 
      font-size: 32px; margin-bottom: 12px; 
      color: #E53935;
    }
    p { color: #888; font-size: 15px; line-height: 1.6; margin-bottom: 8px; }
    .info-box { 
      background: #1a1a1a; border-radius: 8px; 
      padding: 20px; margin: 20px 0; text-align: left; 
    }
    .info-row { 
      display: flex; justify-content: space-between; 
      padding: 6px 0; border-bottom: 1px solid #2a2a2a; 
      font-size: 14px; 
    }
    .info-row:last-child { border-bottom: none; }
    .label { color: #888; }
    .value { color: #F5F0E8; font-weight: 500; }
    .btn-gold {
      display: inline-block; margin-top: 20px; padding: 14px 32px;
      background: #C9A96E; color: #0a0a0a; border-radius: 8px;
      text-decoration: none; font-weight: 700; font-size: 15px;
      transition: background 0.2s ease; width: 100%; text-align: center;
    }
    .btn-gold:hover { background: #8B6914; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
    <h1>Booking Declined</h1>
    <p>Booking <strong>#${booking.id}</strong> for <strong>${booking.guestName}</strong> has been declined.</p>
    
    <div class="info-box">
      <div class="info-row"><span class="label">Apartment</span><span class="value">${apartment.name}</span></div>
      <div class="info-row"><span class="label">Check-in</span><span class="value">${booking.checkIn}</span></div>
      <div class="info-row"><span class="label">Check-out</span><span class="value">${booking.checkOut}</span></div>
    </div>
    
    <p style="color: #4CAF50; font-size: 14px;">
      ✅ Those dates are now available for new bookings.
    </p>
    
    <a href="${guestDeclineLink}" target="_blank" class="btn-gold">
      💬 Notify Guest on WhatsApp
    </a>
  </div>
</body>
</html>`;
  }
  
  /**
   * Generate HTML page for booking cancellation
   * @param {Object} booking - Booking object
   * @param {Object} apartment - Apartment object
   * @param {boolean} refundEligible - Whether refund is eligible
   * @param {number} refundAmount - Refund amount
   * @param {string} guestContactLink - WhatsApp link for guest to contact host
   * @param {string} hostCancellationAlert - WhatsApp link for host alert
   * @returns {string} HTML page content
   */
  static generateCancellationPage(booking, apartment, refundEligible, refundAmount, guestContactLink, hostCancellationAlert) {
    const refundSection = refundEligible ? `
      <div class="status-box status-eligible">
        <p class="status-title">✅ Full Refund Eligible</p>
        <p class="amount">${this.formatNaira(refundAmount)}</p>
        <p style="color:#888; font-size:13px; margin-top:8px;">
          Your refund will be processed manually within 24–48 hours.
          Tap below to follow up with us on WhatsApp.
        </p>
      </div>
    ` : `
      <div class="status-box status-none">
        <p class="status-title">❌ No Refund Applicable</p>
        <p style="color:#888; font-size:13px; margin-top:8px;">
          Cancellation was made within 48 hours of check-in.
          Per our policy, no refund applies.
        </p>
      </div>
    `;
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>Booking Cancelled - Lekki Stays</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0a0a; color: #F5F0E8;
      font-family: 'DM Sans', sans-serif;
      min-height: 100vh; display: flex;
      align-items: center; justify-content: center;
      padding: 20px;
    }
    .card {
      background: #111; border-radius: 16px;
      padding: 48px 40px; max-width: 480px;
      width: 100%; text-align: center;
      border: 1px solid #2a2a2a;
    }
    h1 { 
      font-family: 'Cormorant Garamond', serif; 
      font-size: 32px; margin-bottom: 12px; 
    }
    p { color: #888; font-size: 15px; line-height: 1.6; margin-bottom: 8px; }
    .amount { 
      font-family: 'Cormorant Garamond', serif; 
      font-size: 36px; color: #C9A96E; font-weight: 700; 
    }
    .btn-gold {
      display: inline-block; margin-top: 20px; padding: 14px 32px;
      background: #C9A96E; color: #0a0a0a; border-radius: 8px;
      text-decoration: none; font-weight: 700; font-size: 15px;
      transition: background 0.2s ease; width: 100%; text-align: center;
    }
    .btn-gold:hover { background: #8B6914; }
    .btn-ghost {
      display: inline-block; margin-top: 12px; padding: 12px 32px;
      background: transparent; color: #888; border: 1px solid #2a2a2a;
      border-radius: 8px; text-decoration: none; font-size: 14px;
      width: 100%; text-align: center; transition: all 0.2s ease;
    }
    .btn-ghost:hover { border-color: #C9A96E; color: #C9A96E; }
    .status-box { border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
    .status-eligible { background: rgba(76,175,80,0.08); border: 1px solid #4CAF50; }
    .status-none { background: rgba(229,57,53,0.08); border: 1px solid #E53935; }
    .status-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .status-eligible .status-title { color: #4CAF50; }
    .status-none .status-title { color: #E53935; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 16px;">🚫</div>
    <h1>Booking Cancelled</h1>
    <p>Booking <strong>#${booking.id}</strong> has been cancelled.</p>
    
    ${refundSection}
    
    <p style="color: #4CAF50; font-size: 14px; margin: 16px 0;">
      ✅ Those dates are now available for other guests.
    </p>
    
    <a href="${guestContactLink}" target="_blank" class="btn-gold">
      💬 Contact Us on WhatsApp
    </a>
    
    <a href="/listings.html" class="btn-ghost">
      Browse Other Apartments
    </a>
  </div>
  
  <script>
    // Auto-notify host when this page loads
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.open('${hostCancellationAlert}', '_blank');
      }, 1500);
    });
  </script>
</body>
</html>`;
  }
}

module.exports = WhatsAppNotifier;