// lib/ReceiptDocument.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// UB Colors
const UB_PURPLE = '#7c3090';
const UB_YELLOW = '#fec630';
const TEXT_COLOR = '#333333';
const LINE_COLOR = '#dddddd';

const styles = StyleSheet.create({
  page: {
    width: '100%',
    padding: 6,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT_COLOR,
  },
  container: {
    marginHorizontal: 10,
    marginTop: 5,
    alignItems: 'center',
    maxWidth: 250,
    alignSelf: 'center',
  },
  header: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: UB_PURPLE,
    marginBottom: 4,
    textAlign: 'center',
  },
  subheader: {
    fontSize: 11,
    fontFamily: 'Helvetica',
    fontWeight: 'bold',
    color: UB_YELLOW,
    marginBottom: 8,
    textAlign: 'center',
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: LINE_COLOR,
    marginVertical: 4,
    width: '100%',
  },
  footer: {
    fontSize: 8,
    textAlign: 'center',
    marginTop: 10,
    color: '#666',
  },
});

interface ReceiptProps {
  studentId: string;
  formName: string;
}

export const ReceiptDocument = ({ studentId, formName }: ReceiptProps) => (
  <Document>
    <Page size={[250, 150]} style={styles.page}>
      <View style={styles.container}>
        <Text style={styles.header}>UB FormFlow</Text>
        <Text style={styles.subheader}>TRANSACTION CONFIRMATION</Text>

        <View style={styles.divider} />

        <View style={styles.metadataRow}>
          <Text>Student ID: </Text>
          <Text style={{ fontFamily: 'Helvetica', fontWeight: 'bold' }}>
            {studentId}
          </Text>
        </View>

        <View style={styles.metadataRow}>
          <Text>Date: </Text>
          <Text>{new Date().toLocaleDateString('en-US')}</Text>
        </View>

        <View style={styles.metadataRow}>
          <Text>Form: </Text>
          <Text style={{ fontFamily: 'Helvetica', fontWeight: 'bold' }}>
            {formName}
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.footer}>
          Transaction successfully logged. Thank you for using UB FormFlow.
        </Text>
      </View>
    </Page>
  </Document>
);
