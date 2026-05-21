import PDFDocument from 'pdfkit'

export function generateVolunteerCertificatePdf({
  employeeName,
  companyName,
  eventTitle,
  eventDate,
  location,
  hoursCredited,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', layout: 'landscape' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(28).fillColor('#0f766e').text('Certificate of Volunteering', { align: 'center' })
    doc.moveDown(1.5)
    doc.fillColor('#000').fontSize(14).text('This is to certify that', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(22).text(employeeName, { align: 'center', underline: true })
    doc.moveDown(0.8)
    doc.fontSize(14).text(`of ${companyName} has volunteered at`, { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(18).text(eventTitle, { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(12).text(`${eventDate} · ${location}`, { align: 'center' })
    doc.moveDown(1)
    doc.fontSize(14).text(`Hours credited: ${hoursCredited}`, { align: 'center' })
    doc.moveDown(2)
    doc.fontSize(10).fillColor('#666').text('Issued by SustainAlign Employee Volunteering Module', { align: 'center' })
    doc.end()
  })
}
