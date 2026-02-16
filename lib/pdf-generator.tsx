import { Document, Page, Text, View, StyleSheet, Image, Link } from '@react-pdf/renderer';
import { Lead } from '@/app/dashboard/data';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  // HEADER
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#111827',
    marginBottom: 4,
  },
  docId: {
    fontSize: 10,
    color: '#6B7280',
    fontFamily: 'Helvetica-Bold',
  },
  // ADDRESS GRID
  addressGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  addressBlock: {
    width: '45%',
  },
  label: {
    fontSize: 8,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  // SECTIONS
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 6,
    marginBottom: 10,
    color: '#111827',
  },
  smartRow: {
    flexDirection: 'row',
    marginBottom: 6, 
    borderBottom: '1px solid #F3F4F6', 
    paddingBottom: 4,
  },
  smartKey: {
    width: '35%',
    fontSize: 9,
    color: '#6B7280',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  smartValue: {
    width: '65%',
    fontSize: 10,
    color: '#111827',
    fontFamily: 'Helvetica',
  },
  // FINANCIALS
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderBottom: '1px solid #E5E7EB',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: '1px solid #F3F4F6',
  },
  colDesc: { width: '70%' },
  colAmount: { width: '30%', textAlign: 'right' },
  
  // TOTALS BLOCK
  totalContainer: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    width: '50%',
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'right',
    width: '60%',
    paddingRight: 10,
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
    width: '40%',
  },
  finalTotalText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textAlign: 'right',
    width: '40%',
  },
  
  // FOOTER
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    borderTop: '1px solid #E5E7EB',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  bankBox: {
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 4,
    width: '45%',
  },
  paymentLink: {
    color: '#2563EB',
    textDecoration: 'none',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  }
});

interface PDFProps {
  lead: Lead;
  user: any; 
  type: 'QUOTE' | 'INVOICE';
  amount: number;
  paymentUrl?: string | null; // Made optional
  referenceId: string;
}

export const TradeFlowPDF = ({ lead, user, type, amount, paymentUrl, referenceId }: PDFProps) => {
  const createdDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const jobId = lead.id.slice(0, 6).toUpperCase();

  // --- FINANCIAL CALCULATIONS ---
  const totalJobValue = lead.value || 0;
  
  const paidQuotes = (lead.quoteHistory || []).filter(q => q.status === 'paid').reduce((sum, q) => sum + q.amount, 0);
  const paidInvoices = (lead.invoiceHistory || []).filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const previouslyPaid = paidQuotes + paidInvoices;
  
  const balanceRemaining = totalJobValue - (previouslyPaid + amount);

  // --- DYNAMIC FIELDS RENDERER ---
  const renderDynamicFields = () => {
    const config = user.documentConfig as any[];
    const specs = lead.jobSpecs || {};
    
    if (!config || config.length === 0) return null;

    const activeFields = config.filter(f => specs[f.id] && specs[f.id].toString().trim() !== '');

    if (activeFields.length === 0) return null;

    return (
        <View style={{ marginBottom: 10 }}>
            {activeFields.map((field, i) => {
                let displayValue = specs[field.id];

                if (field.type === 'date') {
                    try {
                        const date = new Date(displayValue);
                        if (!isNaN(date.getTime())) {
                            displayValue = format(date, "EEEE do MMMM yyyy, HH:mm");
                        }
                    } catch (e) {}
                }

                return (
                    <View key={i} style={styles.smartRow}>
                        <Text style={styles.smartKey}>{field.label}</Text>
                        <Text style={styles.smartValue}>{displayValue}</Text>
                    </View>
                );
            })}
        </View>
    );
  };

  // --- SMART NOTES PARSER ---
  const renderSmartNotes = () => {
    if (!lead.notes) return <Text style={{...styles.text, color: '#9CA3AF'}}>No additional notes.</Text>;

    return lead.notes.split('\n').map((line, i) => {
        const cleanLine = line.trim();
        if (!cleanLine) return null;

        if (cleanLine.includes(':')) {
            const [key, ...rest] = cleanLine.split(':');
            const val = rest.join(':').trim();
            return (
                <View key={i} style={styles.smartRow}>
                    <Text style={styles.smartKey}>{key.trim()}</Text>
                    <Text style={styles.smartValue}>{val}</Text>
                </View>
            );
        }
        
        if (cleanLine.startsWith('-') || cleanLine.startsWith('•')) {
            return (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                    <Text style={{ width: 10 }}>•</Text>
                    <Text style={styles.text}>{cleanLine.substring(1).trim()}</Text>
                </View>
            );
        }

        return <Text key={i} style={{...styles.text, marginBottom: 2}}>{cleanLine}</Text>;
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <View>
                {user.companyLogoUrl ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={user.companyLogoUrl} style={styles.logo} />
                ) : (
                    <Text style={{ fontSize: 20, fontFamily: 'Helvetica-Bold' }}>{user.companyName || 'TradeFlow'}</Text>
                )}
            </View>
            <View style={styles.headerRight}>
                <Text style={styles.docTitle}>{type}</Text>
                <Text style={styles.docId}>REF: {jobId}</Text>
                <Text style={{...styles.text, marginTop: 4}}>{createdDate}</Text>
            </View>
        </View>

        {/* ADDRESSES */}
        <View style={styles.addressGrid}>
            <View style={styles.addressBlock}>
                <Text style={styles.label}>From</Text>
                <Text style={styles.bold}>{user.companyName || user.firstName + ' ' + user.lastName}</Text>
                <Text style={styles.text}>{user.companyAddress || 'Address Not Set'}</Text>
                <Text style={styles.text}>{user.companyEmail || user.email}</Text>
                <Text style={styles.text}>{user.companyWebsite}</Text>
            </View>
            <View style={styles.addressBlock}>
                <Text style={styles.label}>Bill To</Text>
                <Text style={styles.bold}>{lead.firstName} {lead.lastName}</Text>
                <Text style={styles.text}>{lead.postcode}</Text>
                <Text style={styles.text}>{lead.email}</Text>
                <Text style={styles.text}>{lead.phone}</Text>
            </View>
        </View>

        {/* JOB SPECIFICATION */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job Specification</Text>
            
            <View style={{ marginBottom: 10 }}>
                <View style={styles.smartRow}>
                    <Text style={styles.smartKey}>Service Type</Text>
                    <Text style={styles.smartValue}>{lead.service || 'General Service'}</Text>
                </View>
                
                {lead.jobDate && (
                    <View style={styles.smartRow}>
                        <Text style={styles.smartKey}>Schedule</Text>
                        <View style={styles.smartValue}>
                            <Text>Start: {new Date(lead.jobDate).toLocaleString('en-GB', { 
                                weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                            })}</Text>
                            {lead.jobEndDate && (
                                <Text>End:   {new Date(lead.jobEndDate).toLocaleString('en-GB', { 
                                    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                                })}</Text>
                            )}
                        </View>
                    </View>
                )}
            </View>

            {renderDynamicFields()}

            {lead.notes && (
                <View style={{ marginTop: 10 }}>
                    <Text style={styles.label}>Additional Notes</Text>
                    {renderSmartNotes()}
                </View>
            )}
        </View>

        {/* FINANCIALS */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Breakdown</Text>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={[styles.text, styles.colDesc, { fontFamily: 'Helvetica-Bold' }]}>Description</Text>
                    <Text style={[styles.text, styles.colAmount, { fontFamily: 'Helvetica-Bold' }]}>Amount</Text>
                </View>
                <View style={styles.tableRow}>
                    <Text style={[styles.text, styles.colDesc]}>
                        {type === 'QUOTE' ? 'Deposit Payment' : 'Invoice Payment'} for {lead.service || 'Services'}
                    </Text>
                    <Text style={[styles.text, styles.colAmount]}>£{amount.toLocaleString()}</Text>
                </View>
            </View>

            <View style={styles.totalContainer}>
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Job Value</Text>
                    <Text style={styles.totalValue}>£{totalJobValue.toLocaleString()}</Text>
                </View>
                
                <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Previously Paid</Text>
                    <Text style={styles.totalValue}>£{previouslyPaid.toLocaleString()}</Text>
                </View>
                
                <View style={{ width: '50%', alignItems: 'flex-end', marginBottom: 4 }}>
                    <View style={{ width: '40%', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }} />
                </View>

                <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#111827', fontFamily: 'Helvetica-Bold' }]}>
                        {type === 'QUOTE' ? 'Deposit Due' : 'Invoice Total'}
                    </Text>
                    <Text style={styles.finalTotalText}>£{amount.toLocaleString()}</Text>
                </View>
                
                <View style={{...styles.totalRow, marginTop: 8}}>
                    <Text style={styles.totalLabel}>Balance Remaining</Text>
                    <Text style={styles.totalValue}>£{Math.max(0, balanceRemaining).toLocaleString()}</Text>
                </View>
            </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
            <View style={styles.bankBox}>
                <Text style={{...styles.label, marginBottom: 6}}>Payment Methods</Text>
                
                {user.bankAccountNumber && (
                    <View style={{ marginBottom: 8 }}>
                        <Text style={styles.bold}>Bank Transfer</Text>
                        <Text style={styles.text}>Account: {user.bankAccountName}</Text>
                        <Text style={styles.text}>Sort: {user.bankSortCode} | Acc: {user.bankAccountNumber}</Text>
                        <Text style={styles.text}>Ref: {jobId}</Text>
                    </View>
                )}

                {/* FIX: Only show Stripe link if paymentUrl exists */}
                {paymentUrl && (
                    <View>
                        <Text style={styles.bold}>Secure Card Payment</Text>
                        <Link src={paymentUrl} style={styles.paymentLink}>
                            Click here to pay securely online
                        </Link>
                    </View>
                )}
            </View>
            
            <View style={{ alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Text style={styles.footerText}>Generated by {user.companyName || 'TradeFlow'}</Text>
                <Text style={styles.footerText}>{user.companyWebsite || 'tradeflow.uk'}</Text>
            </View>
        </View>

      </Page>
    </Document>
  );
};

// --- NEW STYLES FOR CONTRACT ---
const contractStyles = StyleSheet.create({
    title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 20, textAlign: 'center', textTransform: 'uppercase' },
    text: { fontSize: 10, lineHeight: 1.6, marginBottom: 10, color: '#374151' },
    header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30, borderBottom: '1px solid #E5E7EB', paddingBottom: 20 },
    box: { backgroundColor: '#F9FAFB', padding: 15, borderRadius: 4, marginBottom: 20 },
    row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    label: { fontSize: 9, color: '#6B7280', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase' },
    value: { fontSize: 10, fontFamily: 'Helvetica' },
    signatureArea: { marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' },
    signBox: { width: '45%', borderTop: '1px solid #000', paddingTop: 10 },
    signLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold' }
});

interface ContractProps {
    user: any; // The Main Company
    subcontractor: { name: string; phone: string; amount: number };
    lead: Lead; // The Job Context
    date: string;
}

export const SubcontractorAgreementPDF = ({ user, subcontractor, lead, date }: ContractProps) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                
                {/* HEADER */}
                <View style={contractStyles.header}>
                    <View>
                        <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold' }}>{user.companyName || 'TradeFlow'}</Text>
                        <Text style={styles.text}>{user.companyEmail}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.docId}>AGREEMENT</Text>
                        <Text style={styles.text}>{date}</Text>
                    </View>
                </View>

                <Text style={contractStyles.title}>Subcontractor Agreement</Text>

                <Text style={contractStyles.text}>
                    This agreement is made between <Text style={{ fontFamily: 'Helvetica-Bold' }}>{user.companyName}</Text> ("The Contractor") 
                    and <Text style={{ fontFamily: 'Helvetica-Bold' }}>{subcontractor.name}</Text> ("The Subcontractor").
                </Text>

                {/* JOB DETAILS */}
                <View style={contractStyles.box}>
                    <Text style={{ ...contractStyles.label, marginBottom: 10 }}>Scope of Work</Text>
                    <View style={contractStyles.row}>
                        <Text style={contractStyles.label}>Service Type</Text>
                        <Text style={contractStyles.value}>{lead.service || 'General Services'}</Text>
                    </View>
                    <View style={contractStyles.row}>
                        <Text style={contractStyles.label}>Location</Text>
                        <Text style={contractStyles.value}>{lead.postcode}</Text>
                    </View>
                    <View style={contractStyles.row}>
                        <Text style={contractStyles.label}>Start Date</Text>
                        <Text style={contractStyles.value}>
                            {lead.jobDate ? new Date(lead.jobDate).toLocaleDateString('en-GB') : 'TBD'}
                        </Text>
                    </View>
                </View>

                {/* PAYMENT TERMS */}
                <View style={contractStyles.box}>
                    <Text style={{ ...contractStyles.label, marginBottom: 10 }}>Payment Terms</Text>
                    <View style={contractStyles.row}>
                        <Text style={contractStyles.label}>Agreed Rate</Text>
                        <Text style={{ ...contractStyles.value, fontFamily: 'Helvetica-Bold' }}>£{subcontractor.amount.toFixed(2)}</Text>
                    </View>
                    <Text style={{ ...contractStyles.text, marginTop: 10, fontSize: 9, color: '#6B7280' }}>
                        Payment will be released upon satisfactory completion of the work described above. 
                        The Subcontractor is responsible for their own taxes and insurance.
                    </Text>
                </View>

                {/* TERMS */}
                <Text style={contractStyles.text}>
                    1. The Subcontractor agrees to perform the work in a professional manner.
                </Text>
                <Text style={contractStyles.text}>
                    2. The Subcontractor shall provide all necessary tools and equipment unless otherwise agreed.
                </Text>
                <Text style={contractStyles.text}>
                    3. The Subcontractor shall maintain confidentiality regarding the Contractor's clients.
                </Text>

                {/* SIGNATURES */}
                <View style={contractStyles.signatureArea}>
                    <View style={contractStyles.signBox}>
                        <Text style={contractStyles.signLabel}>Signed by {user.companyName}</Text>
                        <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>Date: {date}</Text>
                    </View>
                    <View style={contractStyles.signBox}>
                        <Text style={contractStyles.signLabel}>Signed by {subcontractor.name}</Text>
                        <Text style={{ fontSize: 8, color: '#9CA3AF', marginTop: 4 }}>Date: _______________</Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};