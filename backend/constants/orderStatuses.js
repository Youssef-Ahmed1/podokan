// backend/constants/orderStatuses.js
const TOKEN_CONFIG = {
  accessToken: {
    expiresIn: '1h',
    cookieName: 'token'
  },
  sellerToken: {
    expiresIn: '1h',
    cookieName: 'seller_token'
  },
  cookieConfig: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.testpodokan.store' : undefined
  }
};

module.exports = {
  ORDER_STATUSES: {
    PENDING: 'Pending',
    PROCESSING: 'Processing',
    TRANSFERRED: 'Transferred to delivery partner',
    DELIVERED: 'Delivered',
    REFUND_PROCESSING: 'Refund Processing',
    REFUND_SUCCESS: 'Refund Success',
    CANCELLED: 'Cancelled'
  },
  TOKEN_CONFIG
};