import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { UploadedDocument, CandidateClaim, LiteratureQueryResponse } from '../types';
import { api } from '../services/api';

interface LiteratureWorkspaceScreenProps {
  onRefresh?: () => void;
}

export const LiteratureWorkspaceScreen: React.FC<LiteratureWorkspaceScreenProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<'qa' | 'documents' | 'verification'>('qa');
  
  // Q&A Assistant State
  const [question, setQuestion] = useState<string>('Which catalysts have been investigated for PFOA?');
  const [targetPfas, setTargetPfas] = useState<string>('PFOA');
  const [queryLoading, setQueryLoading] = useState<boolean>(false);
  const [queryResponse, setQueryResponse] = useState<LiteratureQueryResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Documents State
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState<boolean>(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Verification State
  const [claims, setClaims] = useState<CandidateClaim[]>([]);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [notesInput, setNotesInput] = useState<Record<number, string>>({});

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setDocsLoading(true);
      setDocsError(null);
      const docs = await api.getDocuments();
      setDocuments(docs);

      // Collect all candidate claims across documents
      const allClaims: CandidateClaim[] = [];
      docs.forEach((d) => {
        if (d.claims) {
          allClaims.push(...d.claims);
        }
      });
      setClaims(allClaims);
    } catch (err: any) {
      setDocsError(err.message || 'Failed to load literature documents.');
    } finally {
      setDocsLoading(false);
    }
  };

  const handleAskQuestion = async (customQuery?: string) => {
    const q = customQuery || question;
    if (!q.trim()) return;

    try {
      setQueryLoading(true);
      setQueryError(null);
      const res = await api.queryLiterature(q.trim(), targetPfas);
      setQueryResponse(res);
    } catch (err: any) {
      setQueryError(err.message || 'Literature search query failed.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleVerifyClaim = async (claimId: number, status: 'verified' | 'rejected') => {
    try {
      setVerifyingId(claimId);
      const notes = notesInput[claimId] || (status === 'verified' ? 'Approved by researcher review.' : 'Rejected upon manual verification.');
      await api.verifyClaim(claimId, status, notes);
      await loadDocuments();
    } catch (err: any) {
      Alert.alert('Verification Error', err.message || 'Failed to update claim verification status.');
    } finally {
      setVerifyingId(null);
    }
  };

  const sampleQuestions = [
    'Which catalysts have been investigated for PFOA?',
    'Which studies measured fluoride release?',
    'What reaction conditions were used for In2O3?',
    'What transformation products were reported for ZVI?'
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Forensic Grounding Notice */}
      <View style={styles.noticeCard}>
        <View style={styles.noticeHeader}>
          <Text style={styles.noticeIcon}>📖</Text>
          <Text style={styles.noticeTitle}>Source-Grounded Literature Assistant</Text>
        </View>
        <Text style={styles.noticeBody}>
          Every answer and extracted claim is strictly tied to traceable literature passages, DOIs, and pages.
          Extracted claims require explicit researcher verification before integration into the verified knowledge base.
          Zero hallucinated values or citations are permitted.
        </Text>
      </View>

      {/* Sub-Tabs: Q&A | Documents | Claim Verification */}
      <View style={styles.subTabBar}>
        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'qa' && styles.activeSubTabItem]}
          onPress={() => setActiveSubTab('qa')}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'qa' && styles.activeSubTabLabel]}>
            🔬 Evidence Q&A
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'documents' && styles.activeSubTabItem]}
          onPress={() => setActiveSubTab('documents')}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'documents' && styles.activeSubTabLabel]}>
            📁 Documents ({documents.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'verification' && styles.activeSubTabItem]}
          onPress={() => setActiveSubTab('verification')}
        >
          <Text style={[styles.subTabLabel, activeSubTab === 'verification' && styles.activeSubTabLabel]}>
            ✅ Claim Review ({claims.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* VIEW 1: EVIDENCE Q&A */}
      {activeSubTab === 'qa' && (
        <View>
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Ask a Literature Research Question</Text>
            <TextInput
              style={styles.queryInput}
              placeholder="e.g. Which studies measured inorganic fluoride release?"
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={2}
            />

            {/* Quick Sample Questions */}
            <Text style={styles.quickPromptLabel}>Sample Research Questions:</Text>
            <View style={styles.samplePromptsContainer}>
              {sampleQuestions.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.sampleChip}
                  onPress={() => {
                    setQuestion(q);
                    handleAskQuestion(q);
                  }}
                >
                  <Text style={styles.sampleChipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.askButton}
              onPress={() => handleAskQuestion()}
              disabled={queryLoading}
            >
              {queryLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.askButtonText}>Query Grounded Literature Database</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Q&A Error */}
          {queryError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{queryError}</Text>
            </View>
          )}

          {/* Query Response Result Card */}
          {queryResponse && (
            <View style={styles.responseCard}>
              <View style={styles.responseHeaderRow}>
                <Text style={styles.responseCardTitle}>Empirical Synthesis</Text>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{queryResponse.confidence_level}</Text>
                </View>
              </View>

              <Text style={styles.responseAnswerText}>{queryResponse.answer}</Text>

              {queryResponse.missing_evidence_statement && (
                <View style={styles.missingEvidenceBox}>
                  <Text style={styles.missingEvidenceLabel}>Missing Evidence Notice:</Text>
                  <Text style={styles.missingEvidenceText}>{queryResponse.missing_evidence_statement}</Text>
                </View>
              )}

              {/* Citations List */}
              <View style={styles.divider} />
              <Text style={styles.citationsTitle}>
                Traceable Source Passages ({queryResponse.citations.length}):
              </Text>

              {queryResponse.citations.length === 0 ? (
                <Text style={styles.noCitationsText}>No verified source passages found for this query.</Text>
              ) : (
                queryResponse.citations.map((c, i) => (
                  <View key={i} style={styles.citationBox}>
                    <View style={styles.citationTop}>
                      <Text style={styles.citationDocTitle} numberOfLines={1}>
                        📄 {c.document_title}
                      </Text>
                      <Text style={styles.citationSection}>[{c.section_or_page}]</Text>
                    </View>
                    <Text style={styles.citationQuote}>"{c.passage_excerpt}"</Text>
                    {c.doi_or_url && (
                      <Text style={styles.citationDoi}>DOI / Source: {c.doi_or_url}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          )}
        </View>
      )}

      {/* VIEW 2: UPLOADED RESEARCH DOCUMENTS */}
      {activeSubTab === 'documents' && (
        <View>
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Indexed Research Publications & Datasets</Text>
            <Text style={styles.cardSubtitle}>
              Documents are parsed into traceable page/paragraph chunks for source verification and claim extraction.
            </Text>
          </View>

          {docsLoading && (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="large" color="#0284C7" />
              <Text style={styles.loadingText}>Loading document catalog...</Text>
            </View>
          )}

          {documents.map((doc) => (
            <View key={doc.id} style={styles.card}>
              <View style={styles.docHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docFileName}>📄 {doc.filename}</Text>
                  <Text style={styles.docMeta}>
                    {(doc.file_size_bytes / 1024).toFixed(1)} KB • {doc.mime_type} • {doc.chunk_count} chunks extracted
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  doc.extraction_status === 'completed' ? styles.statusBadgeGreen : styles.statusBadgeYellow
                ]}>
                  <Text style={styles.statusBadgeText}>{doc.extraction_status.toUpperCase()}</Text>
                </View>
              </View>

              <Text style={styles.docClaimCount}>
                Extracted Claims: {doc.claims ? doc.claims.length : 0} candidate statements
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* VIEW 3: CANDIDATE CLAIM VERIFICATION INTERFACE */}
      {activeSubTab === 'verification' && (
        <View>
          <View style={styles.card}>
            <Text style={styles.sectionHeading}>Candidate Claim Verification Interface</Text>
            <Text style={styles.cardSubtitle}>
              Researchers inspect each AI-extracted value against the original publication.
              Only verified claims with corroborated inorganic fluoride release are flagged as verified research evidence.
            </Text>
          </View>

          {claims.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No candidate claims pending verification</Text>
              <Text style={styles.emptySubtitle}>Upload research papers or CSV datasets to extract new claims.</Text>
            </View>
          ) : (
            claims.map((claim) => {
              let parsedData: any = {};
              try {
                parsedData = JSON.parse(claim.extracted_data_json);
              } catch (_) {}

              const isPending = claim.verification_status === 'unverified';
              const isVerified = claim.verification_status === 'verified';
              const isRejected = claim.verification_status === 'rejected';

              return (
                <View key={claim.id} style={styles.claimCard}>
                  <View style={styles.claimHeaderRow}>
                    <Text style={styles.claimTypeBadge}>{claim.claim_type.toUpperCase()}</Text>
                    <View style={[
                      styles.statusBadge,
                      isVerified ? styles.statusBadgeGreen : isRejected ? styles.statusBadgeRed : styles.statusBadgeYellow
                    ]}>
                      <Text style={styles.statusBadgeText}>{claim.verification_status.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Extracted Chemical Performance */}
                  <View style={styles.claimDataGrid}>
                    <View style={styles.claimGridItem}>
                      <Text style={styles.claimGridLabel}>Target PFAS:</Text>
                      <Text style={styles.claimGridVal}>{parsedData.target_pfas || 'PFOA'}</Text>
                    </View>
                    <View style={styles.claimGridItem}>
                      <Text style={styles.claimGridLabel}>Catalyst:</Text>
                      <Text style={styles.claimGridVal}>{parsedData.catalyst || 'Experimental Material'}</Text>
                    </View>
                    <View style={styles.claimGridItem}>
                      <Text style={styles.claimGridLabel}>Parent Removal:</Text>
                      <Text style={styles.claimGridVal}>
                        {parsedData.reported_removal_pct ? `${parsedData.reported_removal_pct}%` : 'Not reported'}
                      </Text>
                    </View>
                    <View style={styles.claimGridItem}>
                      <Text style={styles.claimGridLabel}>Defluorination:</Text>
                      <Text style={[
                        styles.claimGridVal,
                        { color: parsedData.reported_defluorination_pct ? '#059669' : '#DC2626' }
                      ]}>
                        {parsedData.reported_defluorination_pct ? `${parsedData.reported_defluorination_pct}%` : 'MISSING (Flagged)'}
                      </Text>
                    </View>
                  </View>

                  {parsedData.context_quote && (
                    <View style={styles.quoteBox}>
                      <Text style={styles.quoteLabel}>Source Passage Excerpt:</Text>
                      <Text style={styles.quoteContent}>"{parsedData.context_quote}"</Text>
                    </View>
                  )}

                  {claim.reviewer_notes && (
                    <Text style={styles.reviewerNotesText}>
                      Reviewer Notes: {claim.reviewer_notes}
                    </Text>
                  )}

                  {/* Action Buttons for Verification */}
                  {isPending && (
                    <View style={styles.claimActionsRow}>
                      <TextInput
                        style={styles.notesInputField}
                        placeholder="Add review audit notes (e.g. verified in Table 2)..."
                        value={notesInput[claim.id] || ''}
                        onChangeText={(txt) => setNotesInput({ ...notesInput, [claim.id]: txt })}
                      />
                      <View style={styles.actionBtns}>
                        <TouchableOpacity
                          style={styles.verifyBtn}
                          onPress={() => handleVerifyClaim(claim.id, 'verified')}
                          disabled={verifyingId === claim.id}
                        >
                          <Text style={styles.verifyBtnText}>✓ Verify</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleVerifyClaim(claim.id, 'rejected')}
                          disabled={verifyingId === claim.id}
                        >
                          <Text style={styles.rejectBtnText}>✕ Reject</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40
  },
  noticeCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  noticeIcon: {
    fontSize: 18,
    marginRight: 8
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#166534'
  },
  noticeBody: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 18
  },
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6
  },
  activeSubTabItem: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  subTabLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B'
  },
  activeSubTabLabel: {
    color: '#0284C7',
    fontWeight: '700'
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16
  },
  queryInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 10,
    minHeight: 50,
    textAlignVertical: 'top'
  },
  quickPromptLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 6
  },
  samplePromptsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  sampleChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  sampleChipText: {
    fontSize: 11,
    color: '#334155'
  },
  askButton: {
    backgroundColor: '#0284C7',
    borderRadius: 8,
    paddingVertical: 11,
    alignItems: 'center'
  },
  askButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 12
  },
  responseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 16
  },
  responseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  responseCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0369A1'
  },
  confidenceBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  confidenceText: {
    fontSize: 10,
    color: '#0284C7',
    fontWeight: '700'
  },
  responseAnswerText: {
    fontSize: 13,
    color: '#0F172A',
    lineHeight: 20,
    marginBottom: 10
  },
  missingEvidenceBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 10,
    marginTop: 6
  },
  missingEvidenceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  missingEvidenceText: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12
  },
  citationsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8
  },
  noCitationsText: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic'
  },
  citationBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  citationTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  citationDocTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1
  },
  citationSection: {
    fontSize: 10,
    color: '#64748B',
    marginLeft: 6
  },
  citationQuote: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    lineHeight: 16
  },
  citationDoi: {
    fontSize: 10,
    color: '#0284C7',
    marginTop: 4
  },
  docHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  docFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A'
  },
  docMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  statusBadgeGreen: {
    backgroundColor: '#DCFCE7'
  },
  statusBadgeYellow: {
    backgroundColor: '#FEF9C3'
  },
  statusBadgeRed: {
    backgroundColor: '#FEE2E2'
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1E293B'
  },
  docClaimCount: {
    fontSize: 12,
    color: '#0284C7',
    marginTop: 8,
    fontWeight: '600'
  },
  claimCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  claimHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  claimTypeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B'
  },
  claimDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8
  },
  claimGridItem: {
    width: '50%',
    marginBottom: 6
  },
  claimGridLabel: {
    fontSize: 10,
    color: '#64748B',
    textTransform: 'uppercase'
  },
  claimGridVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1
  },
  quoteBox: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0284C7',
    marginVertical: 6
  },
  quoteLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700'
  },
  quoteContent: {
    fontSize: 11,
    color: '#334155',
    fontStyle: 'italic',
    marginTop: 2
  },
  reviewerNotesText: {
    fontSize: 11,
    color: '#059669',
    marginTop: 4,
    fontStyle: 'italic'
  },
  claimActionsRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8
  },
  notesInputField: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 7,
    fontSize: 11,
    color: '#0F172A',
    marginBottom: 8
  },
  actionBtns: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  verifyBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  rejectBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6
  },
  rejectBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  centeredBlock: {
    padding: 30,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748B'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569'
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4
  }
});
