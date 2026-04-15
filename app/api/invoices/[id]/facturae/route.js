import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function esc(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function fmtAmount(value) {
  const n = Number(value || 0);
  return n.toFixed(2);
}

export async function POST(req, { params }) {
  try {
    const id = params.id;

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (invoiceError || !invoice) {
      return Response.json(
        { success: false, message: 'Rechnung nicht gefunden.' },
        { status: 404 }
      );
    }

    const { data: lines, error: linesError } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', id)
      .order('position', { ascending: true });

    if (linesError) {
      return Response.json(
        { success: false, message: linesError.message },
        { status: 500 }
      );
    }

    const lineXml = (lines || []).map((line, index) => {
      return `
        <Item>
          <IssuerContractReference></IssuerContractReference>
          <Description>${esc(line.description)}</Description>
          <Quantity>${fmtAmount(line.quantity)}</Quantity>
          <UnitPriceWithoutTax>${fmtAmount(line.unit_price)}</UnitPriceWithoutTax>
          <TotalCost>${fmtAmount(line.line_net)}</TotalCost>
          <GrossAmount>${fmtAmount(line.line_net)}</GrossAmount>
          <TaxesOutputs>
            <Tax>
              <TaxTypeCode>01</TaxTypeCode>
              <TaxRate>${fmtAmount(line.tax_rate)}</TaxRate>
              <TaxableBase>
                <TotalAmount>${fmtAmount(line.line_net)}</TotalAmount>
              </TaxableBase>
              <TaxAmount>
                <TotalAmount>${fmtAmount(line.line_tax)}</TotalAmount>
              </TaxAmount>
            </Tax>
          </TaxesOutputs>
        </Item>
      `;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Facturae xmlns="http://www.facturae.gob.es/formato/Versiones/Facturaev3_2_2.xml">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
    <Batch>
      <BatchIdentifier>${esc(invoice.invoice_number || invoice.id)}</BatchIdentifier>
      <InvoicesCount>1</InvoicesCount>
      <TotalInvoicesAmount>
        <TotalAmount>${fmtAmount(invoice.total)}</TotalAmount>
      </TotalInvoicesAmount>
      <TotalOutstandingAmount>
        <TotalAmount>${fmtAmount(invoice.total)}</TotalAmount>
      </TotalOutstandingAmount>
      <TotalExecutableAmount>
        <TotalAmount>${fmtAmount(invoice.total)}</TotalAmount>
      </TotalExecutableAmount>
      <InvoiceCurrencyCode>${esc(invoice.currency || 'EUR')}</InvoiceCurrencyCode>
    </Batch>
  </FileHeader>

  <Parties>
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${esc(invoice.issuer_tax_number || invoice.issuer_vat_id || '')}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${esc(invoice.issuer_name || '')}</CorporateName>
        <AddressInSpain>
          <Address>${esc(invoice.issuer_address || '')}</Address>
          <PostCode>${esc(invoice.issuer_postal_code || '')}</PostCode>
          <Town>${esc(invoice.issuer_city || '')}</Town>
          <Province>${esc(invoice.issuer_province || '')}</Province>
          <CountryCode>${esc(invoice.issuer_country_code || 'ES')}</CountryCode>
        </AddressInSpain>
      </LegalEntity>
    </SellerParty>

    <BuyerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${esc(invoice.recipient_tax_number || invoice.recipient_vat_id || '')}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${esc(invoice.recipient_name || invoice.kundenname || '')}</CorporateName>
        <AddressInSpain>
          <Address>${esc(invoice.recipient_address || '')}</Address>
          <PostCode>${esc(invoice.recipient_postal_code || '')}</PostCode>
          <Town>${esc(invoice.recipient_city || '')}</Town>
          <Province>${esc(invoice.recipient_province || '')}</Province>
          <CountryCode>${esc(invoice.recipient_country_code || 'ES')}</CountryCode>
        </AddressInSpain>
      </LegalEntity>
    </BuyerParty>
  </Parties>

  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${esc(invoice.invoice_number || '')}</InvoiceNumber>
        <InvoiceSeriesCode>${esc(invoice.series_id || '')}</InvoiceSeriesCode>
        <InvoiceDocumentType>FC</InvoiceDocumentType>
        <InvoiceClass>OO</InvoiceClass>
      </InvoiceHeader>

      <InvoiceIssueData>
        <IssueDate>${esc(invoice.issue_date || '')}</IssueDate>
        <OperationDate>${esc(invoice.service_date || invoice.issue_date || '')}</OperationDate>
        <InvoiceCurrencyCode>${esc(invoice.currency || 'EUR')}</InvoiceCurrencyCode>
        <TaxCurrencyCode>${esc(invoice.currency || 'EUR')}</TaxCurrencyCode>
        <LanguageName>es</LanguageName>
      </InvoiceIssueData>

      <TaxesOutputs>
        <Tax>
          <TaxTypeCode>01</TaxTypeCode>
          <TaxRate>${fmtAmount((lines || [])[0]?.tax_rate || 21)}</TaxRate>
          <TaxableBase>
            <TotalAmount>${fmtAmount(invoice.subtotal)}</TotalAmount>
          </TaxableBase>
          <TaxAmount>
            <TotalAmount>${fmtAmount(invoice.tax_total)}</TotalAmount>
          </TaxAmount>
        </Tax>
      </TaxesOutputs>

      <InvoiceTotals>
        <TotalGrossAmount>${fmtAmount(invoice.subtotal)}</TotalGrossAmount>
        <TotalGeneralDiscounts>${fmtAmount(0)}</TotalGeneralDiscounts>
        <TotalGeneralSurcharges>${fmtAmount(0)}</TotalGeneralSurcharges>
        <TotalGrossAmountBeforeTaxes>${fmtAmount(invoice.subtotal)}</TotalGrossAmountBeforeTaxes>
        <TotalTaxOutputs>${fmtAmount(invoice.tax_total)}</TotalTaxOutputs>
        <TotalTaxesWithheld>${fmtAmount(0)}</TotalTaxesWithheld>
        <InvoiceTotal>${fmtAmount(invoice.total)}</InvoiceTotal>
        <TotalOutstandingAmount>${fmtAmount(invoice.total)}</TotalOutstandingAmount>
        <TotalExecutableAmount>${fmtAmount(invoice.total)}</TotalExecutableAmount>
      </InvoiceTotals>

      <Items>
        ${lineXml}
      </Items>

      <PaymentDetails>
        <Installment>
          <InstallmentDueDate>${esc(invoice.due_date || invoice.issue_date || '')}</InstallmentDueDate>
          <InstallmentAmount>${fmtAmount(invoice.total)}</InstallmentAmount>
          <PaymentMeans>04</PaymentMeans>
          <AccountToBeCredited>
            <IBAN>${esc(invoice.issuer_iban || '')}</IBAN>
            <BankCode>${esc(invoice.issuer_bic || '')}</BankCode>
          </AccountToBeCredited>
        </Installment>
      </PaymentDetails>
    </Invoice>
  </Invoices>
</Facturae>`;

    const hash = sha256(xml);
    const now = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('invoice_documents')
      .update({
        facturae_version: '3.2.2',
        facturae_status: 'generated',
        facturae_xml: xml,
        facturae_hash: hash,
        facturae_created_at: now,
        updated_at: now
      })
      .eq('id', id);

    if (updateError) {
      return Response.json(
        { success: false, message: updateError.message },
        { status: 500 }
      );
    }

    const { error: eventError } = await supabase
      .from('invoice_events')
      .insert({
        invoice_id: id,
        event_type: 'facturae_generated',
        event_label: 'Facturae XML erzeugt',
        actor: 'system',
        actor_type: 'system',
        payload: {
          facturae_version: '3.2.2',
          facturae_hash: hash
        }
      });

    if (eventError) {
      return Response.json(
        { success: false, message: eventError.message },
        { status: 500 }
      );
    }

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': `attachment; filename="facturae_${invoice.invoice_number || id}.xml"`
      }
    });
  } catch (error) {
    return Response.json(
      { success: false, message: error.message || 'Facturae konnte nicht erzeugt werden.' },
      { status: 500 }
    );
  }
}
