import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, FlatList, Platform,
  RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import API_ENDPOINTS, { API_BASE_URL } from "../../config/api";
import { UserStorage } from "../../utils/userStorage";

function showAlert(title: string, msg?: string) {
  if (Platform.OS === "web") window.alert(msg ? `${title}\n\n${msg}` : title);
  else Alert.alert(title, msg);
}

// ─────────────────────────────────────────────
// CONTRACT LIST (no contract_id param)
// ─────────────────────────────────────────────
interface Contract {
  id: number;
  property_name: string;
  property_address: string;
  property_price: number;
  move_in: string;
  lease_duration: string;
  tenant_name?: string;
  tenant_email?: string;
  tenant_signature?: string; // Add signature field
  status: string;
  created_at: string;
}

function ContractsList() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContracts = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`${API_ENDPOINTS.GET_BOOKINGS}?owner_id=${userId}&status=approved&_t=${Date.now()}`);
      const data = await res.json();
      if (data.status === "success") setContracts(data.data ?? []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    UserStorage.getUser("owner").then((user) => {
      if (user) fetchContracts(user.user_id);
      else setLoading(false);
    });
  }, [fetchContracts]);

  function onRefresh() {
    setRefreshing(true);
    UserStorage.getUser("owner").then((user) => { if (user) fetchContracts(user.user_id); });
  }

  function handleViewContract(contract: Contract) {
    router.push({
      pathname: "/owner/contracts",
      params: {
        contract_id: contract.id,
        property_name: contract.property_name,
        property_address: contract.property_address,
        monthly_rent: contract.property_price,
        move_in: contract.move_in,
        lease_duration: contract.lease_duration,
        tenant_name: contract.tenant_name || "Tenant",
        tenant_signature: contract.tenant_signature || "", // Pass signature data
        created_at: contract.created_at,
      },
    } as any);
  }

  function handleDownloadContract(contract: Contract) {
    showAlert("Download Contract", `Contract for ${contract.property_name} will be downloaded. This feature connects to your device's PDF viewer.`);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.listHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.listHeaderTitle}>My Property Contracts</Text>
          <Text style={styles.listHeaderSub}>{contracts.length} active contract{contracts.length !== 1 ? "s" : ""}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh-outline" size={20} color="#1D4ED8" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1D4ED8" />
          <Text style={styles.loadingText}>Loading contracts...</Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="file-document-outline" size={64} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Active Contracts</Text>
              <Text style={styles.emptySub}>
                Contracts appear here once tenants complete the lease agreement process for your properties.
              </Text>
              <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/owner/properties" as any)}>
                <Text style={styles.browseBtnText}>Manage Properties</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.propertyName}>{item.property_name}</Text>
                  <Text style={styles.propertyAddress}>{item.property_address}</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsGrid}>
                {[
                  { icon: "person-outline", label: "Tenant", value: item.tenant_name || "Tenant" },
                  { icon: "cash-outline", label: "Monthly Rent", value: `₱${Number(item.property_price).toLocaleString()}` },
                  { icon: "calendar-outline", label: "Move-in Date", value: item.move_in },
                  { icon: "time-outline", label: "Lease Duration", value: item.lease_duration },
                  { icon: "create-outline", label: "Agreement Date", value: new Date(item.created_at).toLocaleDateString() },
                ].map((row, i) => (
                  <View key={i} style={styles.detailRow}>
                    <Ionicons name={row.icon as any} size={15} color="#64748B" />
                    <View>
                      <Text style={styles.detailLabel}>{row.label}</Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.termsBox}>
                <Ionicons name="information-circle-outline" size={14} color="#2563EB" />
                <Text style={styles.termsText}>
                  This is a legally binding rental agreement. Monthly rent is due on the 1st of each month.
                  30-day notice required for early termination.
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleViewContract(item)}
                >
                  <Ionicons name="eye-outline" size={16} color="#2563EB" />
                  <Text style={styles.actionBtnText}>View Contract</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.downloadBtn]}
                  onPress={() => handleDownloadContract(item)}
                >
                  <MaterialCommunityIcons name="download" size={16} color="#fff" />
                  <Text style={styles.downloadBtnText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// CONTRACT VIEWER (contract_id param present)
// ─────────────────────────────────────────────
function ContractViewer() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    contract_id: string;
    property_name: string;
    property_address: string;
    monthly_rent: string;
    move_in: string;
    lease_duration: string;
    tenant_name: string;
    tenant_signature?: string; // Add signature parameter
    created_at: string;
  }>();

  const [ownerName, setOwnerName] = useState("Property Owner");

  const propertyName  = params.property_name   ?? "Property";
  const propertyAddr  = params.property_address ?? "";
  const monthlyRent   = Number(params.monthly_rent ?? 0);
  const depositAmount = monthlyRent; // Typically same as rent
  const moveIn        = params.move_in ?? "—";
  const leaseDuration = params.lease_duration ?? "—";
  const tenantName    = params.tenant_name ?? "Tenant";
  const tenantSignature = params.tenant_signature ?? ""; // Get signature data
  const contractId    = params.contract_id ?? "";
  const today         = new Date().toLocaleDateString("en-PH", {
    year: "numeric", month: "long", day: "numeric",
  });

  useEffect(() => {
    UserStorage.getUser("owner").then((u) => { if (u) setOwnerName(u.fullname); });
  }, []);

  function handleApproveContract() {
    showAlert("Approve Contract", `Approve the lease agreement for ${propertyName}? The tenant will be notified and the contract will become active.`);
  }

  function handleContactTenant() {
    showAlert("Contact Tenant", `Contact ${tenantName} regarding the lease agreement for ${propertyName}. You can reach out via the PadFinder messaging system.`);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.formHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.formHeaderTitle}>Lease Agreement</Text>
          <Text style={styles.formHeaderSub}>Owner Review - Contract #{contractId}</Text>
        </View>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
        {/* Document Header */}
        <View style={styles.docHeader}>
          <View style={styles.docLogo}>
            <Ionicons name="home" size={22} color="#fff" />
          </View>
          <Text style={styles.docCompany}>PadFinder</Text>
          <Text style={styles.docTitle}>RESIDENTIAL LEASE AGREEMENT</Text>
          <View style={styles.docDividerThick} />
          <Text style={styles.docRef}>Contract Ref: PF-{contractId.padStart(6, "0")}</Text>
          <Text style={styles.docDate}>Date: {today}</Text>
        </View>

        {/* Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTIES TO THIS AGREEMENT</Text>
          <View style={styles.partyCard}>
            <View style={[styles.partyTag, { backgroundColor: "#DBEAFE" }]}>
              <Text style={[styles.partyTagText, { color: "#1D4ED8" }]}>LESSOR (Owner)</Text>
            </View>
            <Text style={styles.partyLabel}>Property Owner / Landlord</Text>
            <Text style={[styles.partyValue, { color: "#1D4ED8", fontWeight: "800" }]}>{ownerName}</Text>
            <Text style={styles.partyNote}>You are the lessor in this agreement.</Text>
          </View>
          <View style={styles.partyCard}>
            <View style={[styles.partyTag, { backgroundColor: "#D1FAE5" }]}>
              <Text style={[styles.partyTagText, { color: "#059669" }]}>LESSEE (Tenant)</Text>
            </View>
            <Text style={styles.partyLabel}>Tenant / Occupant</Text>
            <Text style={styles.partyValue}>{tenantName}</Text>
            <Text style={styles.partyNote}>As registered in PadFinder account.</Text>
          </View>
        </View>

        {/* Property Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROPERTY DETAILS</Text>
          <View style={styles.detailTable}>
            {[
              { label: "Property Name", value: propertyName },
              { label: "Full Address",  value: propertyAddr },
              { label: "Type",          value: "Residential Unit" },
            ].map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={styles.tableLabel}>{row.label}</Text>
                <Text style={styles.tableValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Lease Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEASE TERMS</Text>
          <View style={styles.detailTable}>
            {[
              { label: "Move-In Date",     value: moveIn },
              { label: "Lease Duration",   value: leaseDuration },
              { label: "Monthly Rent",     value: `₱${monthlyRent.toLocaleString()}` },
              { label: "Security Deposit", value: `₱${depositAmount.toLocaleString()}` },
              { label: "Rent Due",         value: "1st of every month" },
              { label: "Late Fee",         value: "₱200/day after 5-day grace period" },
            ].map((row, i) => (
              <View key={i} style={[styles.tableRow, i % 2 === 1 && styles.tableRowAlt]}>
                <Text style={styles.tableLabel}>{row.label}</Text>
                <Text style={[styles.tableValue, row.label === "Monthly Rent" && styles.tableValueHighlight]}>
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERMS AND CONDITIONS</Text>
          {[
            { num: "1",  title: "PAYMENT OF RENT",         body: `Monthly rent of ₱${monthlyRent.toLocaleString()} is due on or before the 1st of each month. A grace period of five (5) days is provided. Payments after the grace period are subject to a ₱200/day late fee.` },
            { num: "2",  title: "SECURITY DEPOSIT",        body: `A deposit of ₱${depositAmount.toLocaleString()} is held in escrow. Returned within 30 days after vacating, less any deductions for damages beyond normal wear and tear.` },
            { num: "3",  title: "USE OF PREMISES",         body: "The property shall be used exclusively for residential purposes. No illegal activity, commercial use, or subletting without written Lessor consent." },
            { num: "4",  title: "MAINTENANCE AND REPAIRS", body: "Lessee maintains cleanliness. Minor repairs (under ₱500) are Lessee's responsibility. Major structural repairs are the Lessor's responsibility." },
            { num: "5",  title: "TERMINATION OF LEASE",    body: "Either party may terminate with 30-day written notice. Early termination by Lessee may result in forfeiture of security deposit." },
            { num: "6",  title: "ENTRY AND INSPECTION",    body: "Lessor may enter with 24-hour advance notice for inspections, repairs, or showings." },
            { num: "7",  title: "UTILITIES",               body: "Lessee is responsible for electricity, water, internet, and cable unless otherwise agreed." },
            { num: "8",  title: "PETS AND ALTERATIONS",    body: "No pets without written consent. No structural alterations without written approval." },
            { num: "9",  title: "RENEWAL",                 body: "Lease may be renewed upon mutual written agreement at least 30 days before expiration." },
            { num: "10", title: "GOVERNING LAW",           body: "This agreement is governed by Philippine law. Disputes shall first be resolved through PadFinder mediation." },
          ].map((clause) => (
            <View key={clause.num} style={styles.clause}>
              <View style={styles.clauseNumBadge}>
                <Text style={styles.clauseNum}>{clause.num}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.clauseTitle}>{clause.title}</Text>
                <Text style={styles.clauseBody}>{clause.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Signatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DIGITAL SIGNATURES</Text>
          <Text style={styles.signatureNote}>Digital signatures captured and verified for this lease agreement.</Text>
          <View style={styles.signaturesRow}>
            <View style={styles.signatureBox}>
              <View style={[styles.signatureContainer, { borderColor: "#1D4ED8" }]}>
                <Text style={styles.signatureStatus}>Owner Signature Required</Text>
                <Text style={styles.signatureHint}>To be signed upon final approval</Text>
              </View>
              <Text style={styles.signatureLabel}>Lessor / Property Owner</Text>
              <Text style={[styles.signatureName, { color: "#1D4ED8", fontWeight: "700" }]}>{ownerName}</Text>
            </View>
            <View style={styles.signatureBox}>
              {tenantSignature ? (
                <View style={[styles.signatureContainer, { borderColor: "#059669", backgroundColor: "#F0FDF4" }]}>
                  <Text style={[styles.signatureStatus, { color: "#059669" }]}>✓ Digitally Signed</Text>
                  <Text style={[styles.signatureHint, { color: "#059669" }]}>Signed on {new Date().toLocaleDateString()}</Text>

                  {/* Display the actual signature image */}
                  <View style={styles.signatureImageContainer}>
                    <Image
                      source={{ uri: `${API_BASE_URL}/${tenantSignature}` }}
                      style={styles.signatureImage}
                      resizeMode="contain"
                      onError={() => {
                        // Fallback: try JPEG version if SVG fails
                        const jpegPath = tenantSignature.replace('.svg', '.jpg').replace('signatures/', 'signatures/sig_only_');
                        console.log('Fallback to JPEG:', jpegPath);
                      }}
                    />
                  </View>

                  <View style={styles.signatureVerificationBadge}>
                    <Ionicons name="shield-checkmark" size={16} color="#059669" />
                    <Text style={styles.signatureVerified}>Legally Binding Signature</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.signatureContainer, { borderColor: "#F59E0B", backgroundColor: "#FFFBEB" }]}>
                  <Ionicons name="time-outline" size={24} color="#F59E0B" />
                  <Text style={[styles.signatureStatus, { color: "#F59E0B", marginTop: 8 }]}>⏳ Signature Pending</Text>
                  <Text style={[styles.signatureHint, { color: "#F59E0B" }]}>Awaiting tenant's digital signature</Text>
                </View>
              )}
              <Text style={styles.signatureLabel}>Lessee / Tenant</Text>
              <Text style={[styles.signatureName, { color: "#059669", fontWeight: "700" }]}>{tenantName}</Text>
            </View>
          </View>
          <View style={styles.effectiveBox}>
            <Ionicons name="calendar-outline" size={14} color="#059669" />
            <Text style={styles.effectiveText}>
              This contract takes effect on <Text style={{ fontWeight: "700" }}>{moveIn}</Text>
            </Text>
          </View>
        </View>

        {/* Owner Actions */}
        <View style={[styles.section, styles.ownerActionsSection]}>
          <Text style={styles.sectionTitle}>OWNER ACTIONS</Text>
          {tenantSignature ? (
            <>
              <Text style={styles.actionsNote}>
                ✅ The tenant has digitally signed this contract. You can now approve this contract to make it active, or contact the tenant if you have any questions.
              </Text>
              <View style={styles.ownerActionsRow}>
                <TouchableOpacity style={styles.contactBtn} onPress={handleContactTenant}>
                  <Ionicons name="mail-outline" size={16} color="#64748B" />
                  <Text style={styles.contactBtnText}>Contact Tenant</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={handleApproveContract}>
                  <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
                  <Text style={styles.approveBtnText}>Approve Contract</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.actionsNote}>
                ⏳ This contract is pending the tenant's digital signature. Once signed, you'll be able to review and approve the contract.
              </Text>
              <View style={styles.ownerActionsRow}>
                <TouchableOpacity style={[styles.contactBtn, { flex: 1 }]} onPress={handleContactTenant}>
                  <Ionicons name="mail-outline" size={16} color="#64748B" />
                  <Text style={styles.contactBtnText}>Contact Tenant</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────
// ROOT EXPORT — smart router
// ─────────────────────────────────────────────
export default function OwnerContractsPage() {
  const params = useLocalSearchParams<{ contract_id?: string }>();
  if (params.contract_id) return <ContractViewer />;
  return <ContractsList />;
}

// ─────────────────────────────────────────────
// SHARED STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: "#F8FAFC" },

  // List styles
  listHeader:        { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  listHeaderTitle:   { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  listHeaderSub:     { fontSize: 12, color: "#64748B", marginTop: 1 },
  refreshBtn:        { width: 34, height: 34, borderRadius: 8, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  center:            { alignItems: "center", paddingVertical: 80 },
  loadingText:       { marginTop: 12, color: "#64748B", fontSize: 14 },
  listContent:       { padding: 14, paddingBottom: 32 },
  empty:             { alignItems: "center", paddingVertical: 60, paddingHorizontal: 24, gap: 10 },
  emptyTitle:        { fontSize: 18, fontWeight: "700", color: "#94A3B8", marginTop: 8 },
  emptySub:          { fontSize: 14, color: "#CBD5E1", textAlign: "center", lineHeight: 20 },
  browseBtn:         { backgroundColor: "#1D4ED8", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
  browseBtnText:     { color: "#fff", fontSize: 14, fontWeight: "700" },
  card:              { backgroundColor: "#fff", borderRadius: 16, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 3, overflow: "hidden" },
  cardHeader:        { flexDirection: "row", alignItems: "center", gap: 12, padding: 16 },
  iconCircle:        { width: 46, height: 46, borderRadius: 23, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  propertyName:      { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  propertyAddress:   { fontSize: 12, color: "#64748B", marginTop: 2 },
  activeBadge:       { backgroundColor: "#D1FAE5", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  activeBadgeText:   { fontSize: 11, fontWeight: "700", color: "#059669" },
  divider:           { height: 1, backgroundColor: "#F1F5F9" },
  detailsGrid:       { padding: 16, gap: 12 },
  detailRow:         { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  detailLabel:       { fontSize: 11, color: "#94A3B8", marginBottom: 2 },
  detailValue:       { fontSize: 13, fontWeight: "600", color: "#1E293B" },
  termsBox:          { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EFF6FF", marginHorizontal: 16, marginBottom: 14, padding: 10, borderRadius: 8 },
  termsText:         { flex: 1, fontSize: 12, color: "#2563EB", lineHeight: 18 },
  actionsRow:        { flexDirection: "row", gap: 10, padding: 14, paddingTop: 12 },
  actionBtn:         { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#EFF6FF" },
  actionBtnText:     { fontSize: 13, color: "#2563EB", fontWeight: "600" },
  downloadBtn:       { backgroundColor: "#059669" },
  downloadBtnText:   { fontSize: 13, color: "#fff", fontWeight: "700" },

  // Form styles
  formHeader:        { backgroundColor: "#fff", flexDirection: "row", alignItems: "center", padding: 14, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0", gap: 10 },
  formHeaderTitle:   { fontSize: 17, fontWeight: "800", color: "#0F172A" },
  formHeaderSub:     { fontSize: 11, color: "#64748B", marginTop: 1 },
  backBtn:           { width: 34, height: 34, borderRadius: 8, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" },
  scroll:            { flex: 1 },
  scrollContent:     { padding: 14, paddingBottom: 20 },
  docHeader:         { backgroundColor: "#fff", borderRadius: 14, padding: 20, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#DBEAFE" },
  docLogo:           { width: 50, height: 50, borderRadius: 12, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  docCompany:        { fontSize: 13, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1.5, marginBottom: 4 },
  docTitle:          { fontSize: 16, fontWeight: "800", color: "#0F172A", letterSpacing: 0.5, textAlign: "center" },
  docDividerThick:   { width: 60, height: 3, backgroundColor: "#1D4ED8", borderRadius: 2, marginVertical: 10 },
  docRef:            { fontSize: 12, color: "#64748B", fontWeight: "600" },
  docDate:           { fontSize: 12, color: "#64748B", marginTop: 2 },
  section:           { backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "#E2E8F0" },
  sectionTitle:      { fontSize: 11, fontWeight: "800", color: "#1D4ED8", letterSpacing: 1.2, marginBottom: 12 },
  partyCard:         { backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  partyTag:          { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
  partyTagText:      { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  partyLabel:        { fontSize: 11, color: "#94A3B8", marginBottom: 2 },
  partyValue:        { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  partyNote:         { fontSize: 11, color: "#94A3B8", marginTop: 3, fontStyle: "italic" },
  detailTable:       { borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#E2E8F0" },
  tableRow:          { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#fff" },
  tableRowAlt:       { backgroundColor: "#F8FAFC" },
  tableLabel:        { flex: 1, fontSize: 12, color: "#64748B", fontWeight: "600" },
  tableValue:        { flex: 1.2, fontSize: 12, fontWeight: "700", color: "#1E293B", textAlign: "right" },
  tableValueHighlight: { color: "#059669", fontSize: 13 },
  clause:            { flexDirection: "row", gap: 10, marginBottom: 14 },
  clauseNumBadge:    { width: 24, height: 24, borderRadius: 12, backgroundColor: "#1D4ED8", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 },
  clauseNum:         { fontSize: 11, fontWeight: "800", color: "#fff" },
  clauseTitle:       { fontSize: 12, fontWeight: "800", color: "#0F172A", marginBottom: 4, letterSpacing: 0.3 },
  clauseBody:        { fontSize: 12, color: "#475569", lineHeight: 19 },
  signatureNote:     { fontSize: 12, color: "#64748B", lineHeight: 18, marginBottom: 14, fontStyle: "italic" },
  signaturesRow:     { flexDirection: "row", gap: 10, marginBottom: 12 },
  signatureBox:      { flex: 1, alignItems: "center" },
  signatureContainer: { width: "100%", minHeight: 80, borderWidth: 2, borderRadius: 8, padding: 12, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  signatureStatus:   { fontSize: 13, fontWeight: "600", color: "#64748B", textAlign: "center" },
  signatureHint:     { fontSize: 11, color: "#94A3B8", textAlign: "center", marginTop: 4 },
  signatureImageContainer: { width: "100%", height: 80, marginVertical: 8, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 6, backgroundColor: "#FAFAFA", overflow: "hidden" },
  signatureImage:    { width: "100%", height: "100%", backgroundColor: "white" },
  signaturePreview:  { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  signatureVerificationBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "rgba(5, 150, 105, 0.1)", borderRadius: 12 },
  signatureVerified: { fontSize: 11, fontWeight: "600", color: "#059669" },
  signatureLine:     { width: "100%", height: 1, borderBottomWidth: 2, borderColor: "#CBD5E1", borderStyle: "dashed", marginBottom: 8 },
  signatureLabel:    { fontSize: 11, color: "#94A3B8", marginBottom: 2 },
  signatureName:     { fontSize: 12, fontWeight: "600", color: "#1E293B", textAlign: "center" },
  effectiveBox:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#D1FAE5", padding: 10, borderRadius: 8 },
  effectiveText:     { fontSize: 12, color: "#065F46" },
  ownerActionsSection: { borderColor: "#DBEAFE", borderWidth: 1.5 },
  actionsNote:       { fontSize: 12, color: "#475569", lineHeight: 18, marginBottom: 14 },
  ownerActionsRow:   { flexDirection: "row", gap: 10 },
  contactBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  contactBtnText:    { fontSize: 13, color: "#64748B", fontWeight: "600" },
  approveBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "#16A34A" },
  approveBtnText:    { fontSize: 13, color: "#fff", fontWeight: "700" },
});
