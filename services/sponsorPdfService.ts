import jsPDF from 'jspdf';
import { Sponsor, Club } from '../types';

export async function generatePartnerValueReport(
  sponsor: Sponsor,
  club: Club
): Promise<Blob> {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('Partner Value Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`${sponsor.name} - ${club.name}`, 20, 30);
  
  let yPos = 50;
  
  // ROI Section
  if (sponsor.roi) {
    doc.setFontSize(16);
    doc.text('ROI Metrics', 20, yPos);
    yPos += 15;
    doc.setFontSize(12);
    doc.text(`Impressions: ${sponsor.roi.impressions?.toLocaleString() || 0}`, 20, yPos);
    yPos += 8;
    doc.text(`Engagement Rate: ${sponsor.roi.engagement_rate?.toFixed(1) || 0}%`, 20, yPos);
    yPos += 8;
    doc.text(`Clicks: ${sponsor.roi.clicks?.toLocaleString() || 0}`, 20, yPos);
    yPos += 8;
    doc.text(`Conversions: ${sponsor.roi.conversions?.toLocaleString() || 0}`, 20, yPos);
    yPos += 15;
    
    if (sponsor.roi.period_start || sponsor.roi.period_end) {
      doc.text(`Period: ${sponsor.roi.period_start ? new Date(sponsor.roi.period_start).toLocaleDateString() : 'N/A'} - ${sponsor.roi.period_end ? new Date(sponsor.roi.period_end).toLocaleDateString() : 'N/A'}`, 20, yPos);
      yPos += 15;
    }
  } else {
    doc.setFontSize(12);
    doc.text('No ROI data available', 20, yPos);
    yPos += 15;
  }
  
  // Contract Details
  doc.setFontSize(16);
  doc.text('Contract Details', 20, yPos);
  yPos += 15;
  doc.setFontSize(12);
  doc.text(`Tier: ${sponsor.tier}`, 20, yPos);
  yPos += 8;
  doc.text(`Value: ${sponsor.value}`, 20, yPos);
  yPos += 8;
  doc.text(`Contract End: ${new Date(sponsor.contract_end).toLocaleDateString()}`, 20, yPos);
  yPos += 8;
  doc.text(`Status: ${sponsor.status}`, 20, yPos);
  yPos += 8;
  doc.text(`Sector: ${sponsor.sector}`, 20, yPos);
  
  // Generate blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}




