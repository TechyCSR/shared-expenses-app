import { Routes, Route, Navigate } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import GroupsList from "./pages/groups/GroupsList"
import CreateGroup from "./pages/groups/CreateGroup"
import GroupDetail from "./pages/groups/GroupDetail"
import ExpensesList from "./pages/expenses/ExpensesList"
import CreateExpense from "./pages/expenses/CreateExpense"
import ExpenseDetail from "./pages/expenses/ExpenseDetail"
import EditExpense from "./pages/expenses/EditExpense"
import RecordSettlement from "./pages/settlements/RecordSettlement"
import GroupBalances from "./pages/balances/GroupBalances"
import ImportUpload from "./pages/import/ImportUpload"
import ImportReview from "./pages/import/ImportReview"
import ImportReportPage from "./pages/import/ImportReportPage"
import Settings from "./pages/Settings"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/groups" element={<GroupsList />} />
      <Route path="/groups/new" element={<CreateGroup />} />
      <Route path="/groups/:id" element={<GroupDetail />} />
      <Route path="/groups/:groupId/expenses" element={<ExpensesList />} />
      <Route path="/groups/:groupId/expenses/new" element={<CreateExpense />} />
      <Route path="/groups/:groupId/expenses/:expenseId" element={<ExpenseDetail />} />
      <Route path="/groups/:groupId/expenses/:expenseId/edit" element={<EditExpense />} />
      <Route path="/groups/:groupId/settlements/new" element={<RecordSettlement />} />
      <Route path="/groups/:groupId/balances" element={<GroupBalances />} />
      <Route path="/groups/:groupId/import" element={<ImportUpload />} />
      <Route path="/groups/:groupId/import/:jobId/review" element={<ImportReview />} />
      <Route path="/groups/:groupId/import/:jobId/report" element={<ImportReportPage />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}