import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

type AdminRecord = {
  id: string
  primary: string
  secondary: string
  merchant: string
  channel: string
  date: string
  amount: string
  status: string
  details: { label: string; value: string }[]
}

type AdminWorkspace = {
  title: string
  eyebrow: string
  description: string
  icon: string
  currencyNote?: string
  metrics: { label: string; value: string; note: string; icon: string; tone: string }[]
  statuses: string[]
  records: AdminRecord[]
}

const workspaces: Record<string, AdminWorkspace> = {
  orders: {
    title: 'Order control', eyebrow: 'Commerce operations', description: 'Monitor marketplace orders across merchants, follow fulfillment, and spot orders that need attention.', icon: 'ri-shopping-bag-3-line', currencyNote: 'Cambodia · USD / KHR',
    metrics: [
      { label: 'Orders today', value: '286', note: '+12.8% vs. yesterday', icon: 'ri-shopping-bag-line', tone: 'amber' },
      { label: 'Awaiting merchant', value: '18', note: 'Oldest waiting 11 min', icon: 'ri-time-line', tone: 'amber' },
      { label: 'In fulfillment', value: '42', note: 'Preparing or with courier', icon: 'ri-truck-line', tone: 'blue' },
      { label: 'Gross sales', value: '$4,820', note: 'Today · before refunds', icon: 'ri-wallet-3-line', tone: 'emerald' },
    ],
    statuses: ['All statuses', 'Awaiting merchant', 'Confirmed', 'Preparing', 'Out for delivery', 'Delivered', 'Cancelled'],
    records: [
      { id: 'XO-10482', primary: 'XO-10482', secondary: 'Sokha Vannak · 2 items', merchant: 'Malis Bakery', channel: 'Marketplace', date: 'Today, 10:42 AM', amount: '$18.40', status: 'Awaiting merchant', details: [{ label: 'Customer', value: 'Sokha Vannak · +855 12 345 678' }, { label: 'Merchant', value: 'Malis Bakery · Phnom Penh' }, { label: 'Items', value: '1 × Butter Croissant, 1 × Iced Latte' }, { label: 'Payment', value: 'KHQR · Paid' }, { label: 'Fulfillment', value: 'Delivery · merchant confirmation required' }, { label: 'Drop-off', value: 'BKK1, Chamkar Mon, Phnom Penh' }] },
      { id: 'XO-10481', primary: 'XO-10481', secondary: 'Chanthy Kim · 3 items', merchant: 'Bopha Market', channel: 'Marketplace', date: 'Today, 10:38 AM', amount: '៛52,000', status: 'Preparing', details: [{ label: 'Customer', value: 'Chanthy Kim · +855 96 111 2200' }, { label: 'Merchant', value: 'Bopha Market · Toul Kork' }, { label: 'Items', value: '3 grocery items' }, { label: 'Payment', value: 'Cash on delivery' }, { label: 'Fulfillment', value: 'Merchant rider · preparing' }, { label: 'Drop-off', value: 'Toul Kork, Phnom Penh' }] },
      { id: 'XO-10480', primary: 'XO-10480', secondary: 'Dara Meas · 1 item', merchant: 'Sovann Electronics', channel: 'Marketplace', date: 'Today, 10:21 AM', amount: '$79.00', status: 'Out for delivery', details: [{ label: 'Customer', value: 'Dara Meas · +855 10 888 231' }, { label: 'Merchant', value: 'Sovann Electronics · Sen Sok' }, { label: 'Items', value: 'USB-C Power Bank' }, { label: 'Payment', value: 'Visa · Paid' }, { label: 'Fulfillment', value: 'Third-party courier · picked up 10:29 AM' }, { label: 'Drop-off', value: 'Sen Sok, Phnom Penh' }] },
      { id: 'XO-10479', primary: 'XO-10479', secondary: 'Sreyneang Ly · 4 items', merchant: 'Urban Tea', channel: 'Marketplace', date: 'Today, 10:05 AM', amount: '$12.60', status: 'Delivered', details: [{ label: 'Customer', value: 'Sreyneang Ly · +855 88 222 1090' }, { label: 'Merchant', value: 'Urban Tea · Boeung Keng Kang' }, { label: 'Items', value: '4 drinks' }, { label: 'Payment', value: 'KHQR · Paid' }, { label: 'Fulfillment', value: 'Delivered 10:31 AM' }, { label: 'Drop-off', value: 'BKK1, Chamkar Mon, Phnom Penh' }] },
      { id: 'XO-10478', primary: 'XO-10478', secondary: 'Rithy Chea · 1 item', merchant: 'Bopha Market', channel: 'Marketplace', date: 'Today, 9:54 AM', amount: '$24.00', status: 'Cancelled', details: [{ label: 'Customer', value: 'Rithy Chea · +855 15 333 772' }, { label: 'Merchant', value: 'Bopha Market · Toul Kork' }, { label: 'Items', value: 'Rice cooker' }, { label: 'Payment', value: 'KHQR · Refund pending' }, { label: 'Reason', value: 'Merchant could not fulfill the item' }, { label: 'Drop-off', value: 'Russian Market, Phnom Penh' }] },
    ],
  },
  customers: {
    title: 'Customer directory', eyebrow: 'Customer experience', description: 'A unified view of customer activity, order history, and service follow-up.', icon: 'ri-user-heart-line', currencyNote: 'Sample profiles · Cambodia',
    metrics: [
      { label: 'Registered customers', value: '8,426', note: '+184 this month', icon: 'ri-user-add-line', tone: 'blue' },
      { label: 'Ordering this month', value: '3,108', note: '37% of registered base', icon: 'ri-shopping-bag-line', tone: 'emerald' },
      { label: 'Support follow-up', value: '12', note: 'Open customer cases', icon: 'ri-customer-service-2-line', tone: 'amber' },
      { label: 'Repeat customers', value: '62%', note: 'Ordered more than once', icon: 'ri-repeat-line', tone: 'indigo' },
    ],
    statuses: ['All statuses', 'Active', 'Needs follow-up', 'Restricted'],
    records: [
      { id: 'CUS-2084', primary: 'Sokha Vannak', secondary: 'sokha.vannak@example.com', merchant: '12 orders', channel: 'Mobile app', date: 'Joined 12 Mar 2026', amount: '$284.60', status: 'Active', details: [{ label: 'Phone', value: '+855 12 345 678' }, { label: 'Email', value: 'sokha.vannak@example.com' }, { label: 'Orders', value: '12 completed · 1 active' }, { label: 'Lifetime spend', value: '$284.60' }, { label: 'Default area', value: 'Chamkar Mon, Phnom Penh' }] },
      { id: 'CUS-2083', primary: 'Chanthy Kim', secondary: 'chanthy.kim@example.com', merchant: '8 orders', channel: 'Mobile app', date: 'Joined 4 Feb 2026', amount: '$168.00', status: 'Active', details: [{ label: 'Phone', value: '+855 96 111 2200' }, { label: 'Email', value: 'chanthy.kim@example.com' }, { label: 'Orders', value: '8 completed' }, { label: 'Lifetime spend', value: '$168.00' }, { label: 'Default area', value: 'Toul Kork, Phnom Penh' }] },
      { id: 'CUS-2082', primary: 'Dara Meas', secondary: 'dara.meas@example.com', merchant: '3 orders', channel: 'Web store', date: 'Joined 18 Jan 2026', amount: '$96.20', status: 'Needs follow-up', details: [{ label: 'Phone', value: '+855 10 888 231' }, { label: 'Email', value: 'dara.meas@example.com' }, { label: 'Orders', value: '3 completed' }, { label: 'Last contact', value: 'Delivery issue · 2 hours ago' }, { label: 'Default area', value: 'Sen Sok, Phnom Penh' }] },
      { id: 'CUS-2081', primary: 'Sreyneang Ly', secondary: 'sreyneang.ly@example.com', merchant: '21 orders', channel: 'Mobile app', date: 'Joined 8 Nov 2025', amount: '$512.80', status: 'Active', details: [{ label: 'Phone', value: '+855 88 222 1090' }, { label: 'Email', value: 'sreyneang.ly@example.com' }, { label: 'Orders', value: '21 completed' }, { label: 'Lifetime spend', value: '$512.80' }, { label: 'Default area', value: 'BKK1, Phnom Penh' }] },
    ],
  },
  delivery: {
    title: 'Delivery operations', eyebrow: 'Fulfillment', description: 'Track active handoffs, delivery partners, service levels, and orders at risk.', icon: 'ri-e-bike-2-line', currencyNote: 'All times · Asia/Phnom_Penh',
    metrics: [
      { label: 'Active deliveries', value: '42', note: 'Across Phnom Penh', icon: 'ri-route-line', tone: 'blue' },
      { label: 'Awaiting pickup', value: '9', note: 'Oldest ready 14 min', icon: 'ri-box-3-line', tone: 'amber' },
      { label: 'At risk', value: '3', note: 'Approaching delivery SLA', icon: 'ri-alarm-warning-line', tone: 'rose' },
      { label: 'On-time today', value: '94.6%', note: 'Target 95%', icon: 'ri-timer-flash-line', tone: 'emerald' },
    ],
    statuses: ['All statuses', 'Awaiting pickup', 'Picked up', 'In transit', 'Delivered', 'Delayed'],
    records: [
      { id: 'DL-6032', primary: 'DL-6032', secondary: 'Order XO-10480', merchant: 'Sovann Electronics', channel: 'Partner courier', date: 'Pickup 10:29 AM', amount: '$1.50 fee', status: 'In transit', details: [{ label: 'Courier', value: 'Nham24 · Rider N-4408' }, { label: 'Merchant', value: 'Sovann Electronics · Sen Sok' }, { label: 'Customer area', value: 'Sen Sok, Phnom Penh' }, { label: 'Promised by', value: '11:10 AM Cambodia time' }, { label: 'Last update', value: 'Picked up · 10:29 AM' }] },
      { id: 'DL-6031', primary: 'DL-6031', secondary: 'Order XO-10482', merchant: 'Malis Bakery', channel: 'Merchant rider', date: 'Ready 10:42 AM', amount: '$1.00 fee', status: 'Awaiting pickup', details: [{ label: 'Courier', value: 'Merchant rider · assignment pending' }, { label: 'Merchant', value: 'Malis Bakery · Phnom Penh' }, { label: 'Customer area', value: 'BKK1, Chamkar Mon' }, { label: 'Promised by', value: '11:20 AM Cambodia time' }, { label: 'Last update', value: 'Awaiting merchant confirmation' }] },
      { id: 'DL-6030', primary: 'DL-6030', secondary: 'Order XO-10476', merchant: 'Urban Tea', channel: 'Partner courier', date: 'Pickup 9:58 AM', amount: '$1.25 fee', status: 'Delayed', details: [{ label: 'Courier', value: 'Nham24 · Rider N-2901' }, { label: 'Merchant', value: 'Urban Tea · BKK1' }, { label: 'Customer area', value: 'Toul Tom Poung, Phnom Penh' }, { label: 'Promised by', value: '10:25 AM Cambodia time' }, { label: 'Last update', value: 'Rider reported traffic · 10:18 AM' }] },
      { id: 'DL-6029', primary: 'DL-6029', secondary: 'Order XO-10472', merchant: 'Bopha Market', channel: 'Merchant rider', date: 'Delivered 10:31 AM', amount: '$0.90 fee', status: 'Delivered', details: [{ label: 'Courier', value: 'Merchant rider · Rithy' }, { label: 'Merchant', value: 'Bopha Market · Toul Kork' }, { label: 'Customer area', value: 'Toul Kork, Phnom Penh' }, { label: 'Delivered at', value: '10:31 AM Cambodia time' }, { label: 'Proof', value: 'Customer confirmation recorded' }] },
    ],
  },
  payments: {
    title: 'Payments & settlements', eyebrow: 'Finance operations', description: 'Review payment outcomes, refund follow-up, and merchant settlement status.', icon: 'ri-bank-card-line', currencyNote: 'KHQR · cash · card · USD / KHR',
    metrics: [
      { label: 'Collected today', value: '$4,820', note: 'Across 286 orders', icon: 'ri-wallet-3-line', tone: 'emerald' },
      { label: 'Settlement due', value: '$1,246', note: '8 merchants · next run 5 PM', icon: 'ri-bank-line', tone: 'blue' },
      { label: 'Refund follow-up', value: '4', note: '$86.40 total', icon: 'ri-refund-2-line', tone: 'amber' },
      { label: 'Payment exceptions', value: '2', note: 'Needs reconciliation', icon: 'ri-error-warning-line', tone: 'rose' },
    ],
    statuses: ['All statuses', 'Paid', 'Pending', 'Refund pending', 'Review required', 'Refunded'],
    records: [
      { id: 'TX-88102', primary: 'TX-88102', secondary: 'Order XO-10482', merchant: 'Malis Bakery', channel: 'KHQR', date: 'Today, 10:42 AM', amount: '$18.40', status: 'Paid', details: [{ label: 'Payment method', value: 'KHQR · Bakong' }, { label: 'Order', value: 'XO-10482' }, { label: 'Merchant', value: 'Malis Bakery' }, { label: 'Reference', value: 'KHQR-7C20-10482' }, { label: 'Settlement', value: 'Next daily settlement · 5:00 PM' }] },
      { id: 'TX-88101', primary: 'TX-88101', secondary: 'Order XO-10478', merchant: 'Bopha Market', channel: 'KHQR', date: 'Today, 9:54 AM', amount: '$24.00', status: 'Refund pending', details: [{ label: 'Payment method', value: 'KHQR · Bakong' }, { label: 'Order', value: 'XO-10478 · cancelled' }, { label: 'Merchant', value: 'Bopha Market' }, { label: 'Reference', value: 'KHQR-4A91-10478' }, { label: 'Next action', value: 'Confirm refund result with payment provider' }] },
      { id: 'TX-88100', primary: 'TX-88100', secondary: 'Order XO-10480', merchant: 'Sovann Electronics', channel: 'Visa', date: 'Today, 10:21 AM', amount: '$79.00', status: 'Paid', details: [{ label: 'Payment method', value: 'Visa · ending 2041' }, { label: 'Order', value: 'XO-10480' }, { label: 'Merchant', value: 'Sovann Electronics' }, { label: 'Reference', value: 'VISA-9981-10480' }, { label: 'Settlement', value: 'Next daily settlement · 5:00 PM' }] },
      { id: 'TX-88099', primary: 'TX-88099', secondary: 'Order XO-10473', merchant: 'Urban Tea', channel: 'Cash', date: 'Today, 9:48 AM', amount: '៛36,000', status: 'Review required', details: [{ label: 'Payment method', value: 'Cash on delivery' }, { label: 'Order', value: 'XO-10473' }, { label: 'Merchant', value: 'Urban Tea' }, { label: 'Issue', value: 'Cash remittance not matched yet' }, { label: 'Next action', value: 'Reconcile delivery remittance' }] },
    ],
  },
  reports: {
    title: 'Platform reports', eyebrow: 'Insights', description: 'A cross-platform snapshot of marketplace performance and service quality.', icon: 'ri-line-chart-line', currencyNote: 'Today · Cambodia time · preview data',
    metrics: [
      { label: 'Gross merchandise value', value: '$4,820', note: '+12.8% vs. yesterday', icon: 'ri-funds-line', tone: 'emerald' },
      { label: 'Completed orders', value: '241', note: '84.3% completion rate', icon: 'ri-checkbox-circle-line', tone: 'blue' },
      { label: 'Average order value', value: '$16.48', note: '+3.2% this week', icon: 'ri-price-tag-3-line', tone: 'indigo' },
      { label: 'Refund rate', value: '1.4%', note: '4 refunds requested today', icon: 'ri-refund-2-line', tone: 'amber' },
    ],
    statuses: ['All statuses', 'Completed', 'In progress', 'Needs attention'],
    records: [
      { id: 'RPT-01', primary: 'Order completion', secondary: '241 completed · 18 awaiting merchant', merchant: 'Platform wide', channel: 'Operations', date: 'Today', amount: '84.3%', status: 'Completed', details: [{ label: 'Completed orders', value: '241' }, { label: 'Awaiting merchant', value: '18' }, { label: 'Cancelled', value: '7' }, { label: 'Completion rate', value: '84.3%' }] },
      { id: 'RPT-02', primary: 'Marketplace sales', secondary: 'Gross merchandise value', merchant: 'Platform wide', channel: 'Sales', date: 'Today', amount: '$4,820', status: 'Completed', details: [{ label: 'Gross merchandise value', value: '$4,820' }, { label: 'Order count', value: '286' }, { label: 'Average order value', value: '$16.48' }, { label: 'Comparison', value: '+12.8% vs. yesterday' }] },
      { id: 'RPT-03', primary: 'Delivery service level', secondary: 'On-time deliveries today', merchant: 'Phnom Penh', channel: 'Fulfillment', date: 'Today', amount: '94.6%', status: 'Needs attention', details: [{ label: 'On-time delivery', value: '94.6%' }, { label: 'Platform target', value: '95%' }, { label: 'At-risk deliveries', value: '3' }, { label: 'Primary cause', value: 'Peak-hour traffic' }] },
      { id: 'RPT-04', primary: 'Merchant response', secondary: 'Median order confirmation time', merchant: 'Platform wide', channel: 'Merchant health', date: 'Today', amount: '4m 12s', status: 'In progress', details: [{ label: 'Median confirmation', value: '4m 12s' }, { label: 'Orders waiting', value: '18' }, { label: 'Target', value: 'Under 5 minutes' }] },
    ],
  },
}

const metricTone: Record<string, string> = {
  amber: 'bg-amber-50 text-amber-700', blue: 'bg-sky-50 text-sky-700', emerald: 'bg-emerald-50 text-emerald-700',
  rose: 'bg-rose-50 text-rose-700', indigo: 'bg-indigo-50 text-indigo-700',
}

function statusVariant(status: string): 'emerald' | 'amber' | 'rose' | 'blue' | 'slate' {
  const value = status.toLowerCase()
  if (value === 'delivered' || value === 'paid' || value === 'refunded' || value === 'completed' || value === 'active') return 'emerald'
  if (value.includes('awaiting') || value.includes('pending') || value.includes('follow-up') || value.includes('progress')) return 'amber'
  if (value.includes('cancel') || value.includes('delayed') || value.includes('restricted') || value.includes('attention') || value.includes('review required')) return 'rose'
  if (value.includes('transit') || value.includes('pickup') || value.includes('preparing') || value.includes('out for delivery')) return 'blue'
  return 'slate'
}

export const AdminOperationsPage: React.FC = () => {
  const { section = 'orders' } = useParams()
  const workspace = workspaces[section] ?? workspaces.orders
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState('All statuses')
  const [selectedRecord, setSelectedRecord] = useState<AdminRecord | null>(null)

  const records = useMemo(() => workspace.records.filter((record) => {
    const matchesStatus = activeStatus === 'All statuses' || record.status === activeStatus
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [record.id, record.primary, record.secondary, record.merchant, record.channel, record.status].some((value) => value.toLowerCase().includes(query))
    return matchesStatus && matchesSearch
  }), [workspace.records, activeStatus, search])

  const exportRecords = () => {
    const columns = ['ID', 'Name', 'Details', 'Merchant', 'Channel', 'Date', 'Amount', 'Status']
    const lines = records.map((record) => [record.id, record.primary, record.secondary, record.merchant, record.channel, record.date, record.amount, record.status])
    const csv = [columns, ...lines].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `x-admin-${section}-preview.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.14em] text-zinc-400">
            <i className={workspace.icon} /> {workspace.eyebrow}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{workspace.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">{workspace.description}</p>
        </div>
        <Badge variant="indigo" dot>Design preview · sample data</Badge>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-700"><i className="ri-information-line" /></span>
          <div>
            <p className="text-xs font-semibold text-sky-950">Preview workspace</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-sky-800">These records demonstrate the unified admin experience. Actions here do not change live orders, payments, customers, or deliveries.</p>
          </div>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-sky-800">{workspace.currencyNote}</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workspace.metrics.map((metric) => (
          <article key={metric.label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">{metric.label}</span>
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${metricTone[metric.tone]}`}><i className={metric.icon} /></span>
            </div>
            <div className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{metric.value}</div>
            <p className="mt-1 text-[11px] text-zinc-400">{metric.note}</p>
          </article>
        ))}
      </div>

      {section === 'reports' && (
        <section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-sm font-semibold text-zinc-900">Order volume · last 7 days</h2><p className="mt-1 text-[11px] text-zinc-400">Sample daily orders · Cambodia time</p></div>
            <Badge variant="slate">This week</Badge>
          </div>
          <div className="mt-6 flex h-40 items-end gap-3 border-b border-zinc-100 pb-2 sm:gap-5">
            {[42, 57, 48, 71, 64, 86, 100].map((height, index) => (
              <div key={index} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                <span className="text-[10px] font-medium text-zinc-500">{Math.round(height * 2.86)}</span>
                <div className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-brand-dark to-[#8b84e8]" style={{ height: `${height}%` }} />
                <span className="text-[10px] text-zinc-400">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-2xs">
        <div className="flex flex-col gap-4 border-b border-zinc-100 px-4 py-4 lg:flex-row lg:items-center lg:justify-between sm:px-5">
          <div><h2 className="text-sm font-semibold text-zinc-900">{section === 'orders' ? 'Recent orders' : section === 'customers' ? 'Customer profiles' : section === 'delivery' ? 'Live delivery queue' : section === 'payments' ? 'Recent transactions' : 'Platform indicators'}</h2><p className="mt-0.5 text-[11px] text-zinc-400">{records.length} preview records</p></div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-400 focus-within:border-zinc-400">
              <i className="ri-search-line" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" className="w-full min-w-44 bg-transparent text-zinc-800 outline-none placeholder:text-zinc-400" />
            </label>
            <select value={activeStatus} onChange={(event) => setActiveStatus(event.target.value)} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 outline-none focus:border-zinc-400">
              {workspace.statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <button type="button" onClick={exportRecords} className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"><i className="ri-download-2-line" /> Export</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50/80 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              <tr><th className="px-5 py-3">Record</th><th className="px-5 py-3">Merchant / scope</th><th className="px-5 py-3">Channel</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {records.map((record) => (
                <tr key={record.id} className="transition hover:bg-zinc-50/70">
                  <td className="px-5 py-3.5"><div className="font-semibold text-zinc-900">{record.primary}</div><div className="mt-0.5 text-[11px] text-zinc-400">{record.secondary}</div></td>
                  <td className="px-5 py-3.5 text-zinc-700">{record.merchant}</td>
                  <td className="px-5 py-3.5 text-zinc-500">{record.channel}</td>
                  <td className="px-5 py-3.5 text-zinc-500">{record.date}</td>
                  <td className="px-5 py-3.5 font-semibold text-zinc-800">{record.amount}</td>
                  <td className="px-5 py-3.5"><Badge variant={statusVariant(record.status)} dot>{record.status}</Badge></td>
                  <td className="px-5 py-3.5 text-right"><button type="button" onClick={() => setSelectedRecord(record)} className="rounded-md px-2.5 py-1.5 font-medium text-zinc-700 hover:bg-zinc-100">View</button></td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={7} className="px-5 py-16 text-center"><i className="ri-search-line text-xl text-zinc-300" /><p className="mt-2 text-xs font-medium text-zinc-700">No matching records</p><p className="mt-1 text-[11px] text-zinc-400">Change the search or status filter and try again.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-2 border-t border-zinc-100 px-5 py-3 text-[10px] text-zinc-400 sm:flex-row sm:items-center sm:justify-between"><span>Preview dataset · No live customer or payment data is displayed.</span><span>Times shown in Asia/Phnom_Penh</span></div>
      </section>

      <Modal isOpen={Boolean(selectedRecord)} onClose={() => setSelectedRecord(null)} title={selectedRecord?.primary ?? 'Record details'} subtitle={selectedRecord ? `${selectedRecord.id} · ${selectedRecord.merchant}` : undefined} maxWidth="2xl">
        {selectedRecord && <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 p-4"><div><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Current status</div><div className="mt-1"><Badge variant={statusVariant(selectedRecord.status)} dot>{selectedRecord.status}</Badge></div></div><div className="text-right"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Amount</div><div className="mt-1 text-lg font-semibold text-zinc-900">{selectedRecord.amount}</div></div></div>
          <div className="grid gap-3 sm:grid-cols-2">{selectedRecord.details.map((detail) => <div key={detail.label} className="rounded-lg border border-zinc-200 p-3"><div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{detail.label}</div><div className="mt-1 text-xs leading-relaxed text-zinc-800">{detail.value}</div></div>)}</div>
          <div className="flex justify-end border-t border-zinc-100 pt-4"><button type="button" onClick={() => setSelectedRecord(null)} className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-800">Close details</button></div>
        </div>}
      </Modal>
    </div>
  )
}
