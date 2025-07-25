const express = require('express');
const router = express.Router();
const BookingService = require('../services/bookingService.js');
const { requireUser } = require('./middleware/auth.js');

// Create new booking
// The 'requireUser' middleware handles token verification for us.
router.post('/', requireUser, async (req, res) => {
  try {
    const buyerId = req.user.id; // Get the logged-in user's ID from the middleware
    const bookingData = req.body; // Contains propertyId, preferredDate, etc.

    console.log(`[BOOKING] POST /api/bookings - Creating booking for user ${buyerId}`);

    // Pass the request body and the buyer's ID to the service
    const newBooking = await BookingService.create(bookingData, buyerId);

    console.log(`[BOOKING] Booking created successfully with ID: ${newBooking.id}`);

    res.status(201).json({
      success: true,
      booking: newBooking,
      message: 'Booking request sent successfully'
    });
  } catch (error) {
    console.error('[BOOKING] Error creating booking:', error.message);
    // Avoid sending detailed database errors to the client
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred while creating the booking.'
    });
  }
});

// Get user's bookings
router.get('/my-bookings', requireUser, async (req, res) => {
  try {
    console.log(`[BOOKING] GET /api/bookings/my-bookings - Fetching bookings for user ${req.user.id}`);

    const bookings = await BookingService.getByUserId(req.user.id);

    console.log(`[BOOKING] Retrieved ${bookings.length} bookings for user ${req.user.id}`);

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('[BOOKING] Error fetching user bookings:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single booking
router.get('/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[BOOKING] GET /api/bookings/${id} - Fetching booking details`);

    const booking = await BookingService.get(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    console.log(`[BOOKING] Booking ${id} retrieved successfully`);

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('[BOOKING] Error fetching booking:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update booking status
router.put('/:id/status', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log(`[BOOKING] PUT /api/bookings/${id}/status - Updating booking status to ${status}`);

    const updatedBooking = await BookingService.updateStatus(id, status);

    console.log(`[BOOKING] Booking ${id} status updated successfully`);

    res.json({
      success: true,
      booking: updatedBooking,
      message: 'Booking status updated successfully'
    });
  } catch (error) {
    console.error('[BOOKING] Error updating booking status:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Cancel booking
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[BOOKING] DELETE /api/bookings/${id} - Canceling booking`);

    await BookingService.cancel(id);

    console.log(`[BOOKING] Booking ${id} canceled successfully`);

    res.json({
      success: true,
      message: 'Booking canceled successfully'
    });
  } catch (error) {
    console.error('[BOOKING] Error canceling booking:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
