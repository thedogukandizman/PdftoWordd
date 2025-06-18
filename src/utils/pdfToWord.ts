import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min?url';
import { Document, Packer, Paragraph } from 'docx';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export async function convertPdfToWord(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let allText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => (item as any).str).join(' ');
    allText += pageText + '\n\n';
  }

  if (!allText || allText.trim().length < 10) {
    throw new Error("No valid text found in PDF.");
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [new Paragraph(allText)],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, file.name.replace('.pdf', '.docx'));
} 