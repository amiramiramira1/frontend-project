import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateReceipt(order) {
// Build the receipt element dynamically
    const element = document.createElement('div');
    element.style.cssText = 'position:absolute;left:-9999px;top:0;width:600px;background:#fff;padding:40px;font-family:sans-serif;';

    element.innerHTML = `
        <div style="border-bottom:2px solid #f97316;padding-bottom:20px;margin-bottom:20px;">
        <h1 style="color:#f97316;font-size:28px;font-weight:bold;margin:0;">Boxify</h1>
        <p style="color:#6b7280;margin:4px 0 0;">Fresh meal boxes delivered to your door</p>
        </div>
        <div style="margin-bottom:24px;">
        <h2 style="font-size:20px;font-weight:bold;margin-bottom:12px;">Order Receipt</h2>
        <table style="width:100%;border-collapse:collapse;">
            <tr><td style="color:#6b7280;padding:4px 0;">Order Number</td><td style="font-weight:bold;text-align:right;">${order.orderNumber}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Date</td><td style="text-align:right;">${new Date(order.createdAt).toLocaleDateString('en-EG')}</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Payment</td><td style="text-align:right;">Cash on Delivery</td></tr>
            <tr><td style="color:#6b7280;padding:4px 0;">Status</td><td style="text-align:right;">${order.status}</td></tr>
        </table>
        </div>
        ${order.deliveryAddress ? `
        <div style="margin-bottom:24px;">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:8px;">Delivery Address</h3>
        <p style="color:#374151;margin:0;">${order.customerName || ''}</p>
        <p style="color:#6b7280;margin:2px 0;">${order.deliveryAddress.street}, ${order.deliveryAddress.city}</p>
        <p style="color:#6b7280;margin:2px 0;">${order.deliveryAddress.phone}</p>
        </div>` : ''}
        ${order.items ? `
        <div style="margin-bottom:24px;">
        <h3 style="font-size:16px;font-weight:bold;margin-bottom:8px;">Order Items</h3>
        ${order.items.map(item => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6;">
            <span>${item.type === 'pre-made-box' ? item.boxName : 'Custom Box'} ×${item.quantity || 1}</span>
            <span style="font-weight:bold;">${item.totalPrice?.toLocaleString()} EGP</span>
            </div>
        `).join('')}
        <div style="display:flex;justify-content:space-between;padding:12px 0;font-weight:bold;font-size:18px;">
            <span>Total</span>
            <span style="color:#f97316;">${order.totalPrice?.toLocaleString()} EGP</span>
        </div>
        </div>` : ''}
        <div style="margin-bottom:24px;background:#fff7ed;padding:16px;border-radius:8px;">
        <p style="margin:0;color:#374151;">🚚 Estimated Delivery: <strong>${new Date(order.deliveryDate).toLocaleDateString('en-EG', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</strong></p>
        ${order.timeSlot ? `<p style="margin:4px 0 0;color:#374151;">🕐 Time Slot: <strong>${order.timeSlot}</strong></p>` : ''}
        </div>
        <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;color:#9ca3af;font-size:14px;">
        <p style="margin:0;">Thank you for choosing Boxify! 🎉</p>
        <p style="margin:4px 0 0;">Questions? Contact us at support@boxify.com</p>
        </div>
    `;

    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
    });

    document.body.removeChild(element);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    pdf.save(`boxify-receipt-${order.orderNumber}.pdf`);
}