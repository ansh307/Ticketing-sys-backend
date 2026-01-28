const QRCode = require('qrcode');

exports.generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(data));
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('QR code generation failed');
  }
};
