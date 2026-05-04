/**
 * WhatsApp Integration (Supabase)
 * 
 * Handles WhatsApp message generation for booking notifications
 * Uses booking reference system instead of token-based links
 */

class WhatsAppNotifier {
  /**
   * Generate WhatsApp URL with pre-filled message
   */
  static generateWhatsAppURL(phoneNumber, message) {
    const cleanPhone = phoneNumber.replace(/[^\d]/g, '');
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Generate host notification for new booking
   */
  static generateHostNotification(booking, apartment) {
    const message = `
🏨 *NEW BOOKING REQUEST*

📋 *Booking Details:*
Ref: ${booking.bookingRef}
Apartment: ${apartment.name}

👤 *Guest Information:*
Name: ${booking.guestName}
Phone: ${booking.guestPhone}
Email: ${booking.guestEmail}

📅 *Stay Details:*
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.guests}
Nights: ${booking.getNights()}

💰 *Payment:*
Total: ₦${booking.totalPrice.toLocaleString()}

⏰ *Status:* Pending Confirmation

Please review and respond to this booking request.
    `.trim();

    return WhatsAppNotifier.generateWhatsAppURL(
      process.env.HOST_WHATSAPP_NUMBER,
      message
    );
  }

  /**
   * Generate guest confirmation message
   */
  static generateGuestConfirmationMessage(booking, apartment) {
    const message = `
✅ *BOOKING CONFIRMED*

Thank you for booking with LuxStay!

📋 *Booking Reference:* ${booking.bookingRef}

🏨 *Property:*
${apartment.name}
${apartment.location}

📅 *Your Stay:*
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.guests}
Nights: ${booking.getNights()}

💰 *Payment Due:*
Total: ₦${booking.totalPrice.toLocaleString()}
Deadline: ${booking.paymentDeadline ? new Date(booking.paymentDeadline).toLocaleString() : '24 hours'}

⚠️ *Important:*
Please complete payment within 24 hours to secure your booking.

Need help? Reply to this message or call us.
    `.trim();

    return message;
  }

  /**
   * Generate guest decline message
   */
  static generateGuestDeclineMessage(booking, apartment) {
    const message = `
❌ *BOOKING DECLINED*

We're sorry, but your booking request has been declined.

📋 *Booking Reference:* ${booking.bookingRef}
🏨 *Property:* ${apartment.name}
📅 *Dates:* ${booking.checkIn} to ${booking.checkOut}

We apologize for any inconvenience. Please try:
• Different dates for the same property
• Alternative properties in the same area

Browse available apartments: ${process.env.BASE_URL || 'https://shortlet-booking-khaki.vercel.app'}

Need assistance? Reply to this message.
    `.trim();

    return message;
  }

  /**
   * Generate payment reminder message
   */
  static generatePaymentReminder(booking, apartment) {
    const hoursRemaining = booking.paymentDeadline 
      ? Math.ceil((new Date(booking.paymentDeadline) - new Date()) / (1000 * 60 * 60))
      : 24;

    const message = `
⏰ *PAYMENT REMINDER*

Your booking payment is due soon!

📋 *Booking Reference:* ${booking.bookingRef}
🏨 *Property:* ${apartment.name}
💰 *Amount Due:* ₦${booking.totalPrice.toLocaleString()}
⏱️ *Time Remaining:* ${hoursRemaining} hours

Please complete payment to secure your booking.

Payment deadline: ${booking.paymentDeadline ? new Date(booking.paymentDeadline).toLocaleString() : 'Within 24 hours'}

⚠️ *Note:* Unpaid bookings will be automatically cancelled after the deadline.

Need help with payment? Reply to this message.
    `.trim();

    return message;
  }

  /**
   * Generate payment confirmation message
   */
  static generatePaymentConfirmation(booking, apartment) {
    const message = `
🎉 *PAYMENT CONFIRMED*

Your booking is now complete!

📋 *Booking Reference:* ${booking.bookingRef}

🏨 *Property:*
${apartment.name}
${apartment.location}

📅 *Your Stay:*
Check-in: ${booking.checkIn} (from 2:00 PM)
Check-out: ${booking.checkOut} (by 12:00 PM)
Guests: ${booking.guests}

💰 *Payment:*
Amount Paid: ₦${booking.totalPrice.toLocaleString()}
Status: ✅ Confirmed

📍 *Check-in Instructions:*
You will receive detailed check-in instructions 24 hours before your arrival.

📞 *Contact:*
For any questions, reply to this message or call ${process.env.HOST_WHATSAPP_NUMBER}

We look forward to hosting you! 🏡
    `.trim();

    return message;
  }

  /**
   * Generate cancellation confirmation message
   */
  static generateCancellationMessage(booking, apartment, refundAmount = 0, cancelledBy = 'guest', reason = null) {
    const hasRefund = refundAmount > 0;
    const cancelledByHost = cancelledBy === 'host' || cancelledBy === 'admin';

    let message = `
🚫 *BOOKING CANCELLED*

${cancelledByHost 
  ? 'We regret to inform you that your booking has been cancelled by the property host.'
  : 'Your booking cancellation has been processed.'
}

📋 *Cancellation Details:*
Booking Reference: ${booking.bookingRef}
Property: ${apartment.name}
Location: ${apartment.location || 'Lagos, Nigeria'}
Check-in: ${booking.checkIn}
Check-out: ${booking.checkOut}
Guests: ${booking.guests}
Nights: ${booking.getNights()}

💰 *Payment & Refund:*
Original Amount: ₦${booking.totalPrice.toLocaleString()}
${hasRefund 
  ? `Refund Amount: ₦${refundAmount.toLocaleString()}\nRefund Status: Processing\nExpected: 5-7 business days\nMethod: Original payment method`
  : `Refund Amount: ₦0\nReason: ${cancelledByHost ? 'Host cancellation - no charges applied' : 'Cancellation within 48 hours of check-in'}`
}

${reason ? `📝 *Cancellation Reason:*\n${reason}\n` : ''}
${cancelledByHost 
  ? `\n🙏 *Our Sincere Apologies:*\nWe understand this is disappointing and inconvenient. We're here to help you find an alternative accommodation.\n`
  : `\n✅ *Cancellation Confirmed:*\nYour booking has been successfully cancelled. No further action is required.\n`
}

${cancelledByHost 
  ? `💡 *Next Steps:*\n• Browse alternative properties on our website\n• Contact us for personalized recommendations\n• We'll prioritize your next booking\n`
  : `💡 *Book Again:*\nWe'd love to host you in the future!\n`
}

🌐 *Find Your Next Stay:*
${process.env.BASE_URL || 'https://shortlet-booking-khaki.vercel.app'}

📞 *Need Assistance?*
Reply to this message or call us at ${process.env.HOST_WHATSAPP_NUMBER}

${cancelledByHost 
  ? 'Thank you for your understanding. We hope to serve you better next time.'
  : 'We hope to welcome you soon!'
}
    `.trim();

    return message;
  }

  /**
   * Generate auto-decline message (payment deadline expired)
   */
  static generateAutoDeclineMessage(booking, apartment) {
    const message = `
⏰ *BOOKING AUTO-CANCELLED*

Your booking was automatically cancelled due to non-payment.

📋 *Booking Reference:* ${booking.bookingRef}
🏨 *Property:* ${apartment.name}
📅 *Dates:* ${booking.checkIn} to ${booking.checkOut}

The 24-hour payment deadline has passed.

💡 *Want to rebook?*
The property may still be available. Check availability and create a new booking:

${process.env.BASE_URL || 'https://shortlet-booking-khaki.vercel.app'}

Questions? Reply to this message.
    `.trim();

    return message;
  }

  /**
   * Generate check-in instructions message (sent 24h before check-in)
   */
  static generateCheckInInstructions(booking, apartment) {
    const message = `
🏡 *CHECK-IN INSTRUCTIONS*

Your stay begins tomorrow!

📋 *Booking Reference:* ${booking.bookingRef}
🏨 *Property:* ${apartment.name}

📍 *Address:*
${apartment.location}
[Google Maps link will be provided]

⏰ *Check-in Time:*
From 2:00 PM onwards

🔑 *Access Instructions:*
1. Arrive at the property
2. Contact the property manager: ${process.env.HOST_WHATSAPP_NUMBER}
3. You will be met and given keys

📦 *What to Bring:*
• Valid ID
• Booking reference: ${booking.bookingRef}

📞 *Emergency Contact:*
${process.env.HOST_WHATSAPP_NUMBER}

Have a wonderful stay! 🌟
    `.trim();

    return message;
  }

  /**
   * Generate host booking summary (for admin dashboard)
   */
  static generateHostBookingSummary(booking, apartment) {
    const statusEmoji = {
      pending: '⏳',
      confirmed: '✅',
      payment_pending: '💰',
      paid: '🎉',
      declined: '❌',
      auto_declined: '⏰',
      cancelled: '🚫'
    };

    const message = `
${statusEmoji[booking.status] || '📋'} *BOOKING SUMMARY*

*Reference:* ${booking.bookingRef}
*Status:* ${booking.status.toUpperCase()}

*Property:*
${apartment.name}

*Guest:*
${booking.guestName}
${booking.guestPhone}
${booking.guestEmail}

*Stay:*
${booking.checkIn} → ${booking.checkOut}
${booking.getNights()} nights, ${booking.guests} guests

*Payment:*
₦${booking.totalPrice.toLocaleString()}
${booking.paidAt ? `Paid: ${new Date(booking.paidAt).toLocaleString()}` : 'Not paid'}

*Created:* ${new Date(booking.createdAt).toLocaleString()}
    `.trim();

    return message;
  }
}

module.exports = WhatsAppNotifier;
