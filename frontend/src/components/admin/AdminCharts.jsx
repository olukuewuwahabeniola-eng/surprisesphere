import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const GOLD = '#F1D58A';
const GOLD_SOFT = '#F1D58A';
const BLACK = '#0B0B0B';
const GREEN = '#F1D58A';
const ORANGE = '#F1D58A';
const SURFACE = '#201D18';
const MUTED = 'rgba(255,255,255,0.64)';
const GRID = 'rgba(241,213,138,0.14)';

export function Sparkline({ values = [], color = GOLD }) {
  const data = (values.length ? values : [0, 0]).map((value, index) => ({
    index,
    value: Number(value) || 0,
  }));
  return (
    <div className="admin-sparkline">
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.14}
            strokeWidth={2}
            dot={false}
            isAnimationActive
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function OverviewLineChart({ series = [] }) {
  const hasSignal = series.some(
    (row) =>
      Number(row.visitors) > 0 || Number(row.addToCart) > 0 || Number(row.whatsappEnquiries) > 0,
  );

  if (!series.length || !hasSignal) {
    return <p className="admin-chart-empty">No analytics events recorded for this period yet.</p>;
  }

  const data = series.map((row) => ({
    ...row,
    label: String(row.date || '').slice(5),
  }));

  return (
    <div className="admin-chart-wrap">
      <div className="admin-chart-legend is-top">
        <span>
          <i style={{ background: GOLD }} /> Website Visitors
        </span>
        <span>
          <i style={{ background: GOLD_SOFT }} /> Add to Cart
        </span>
        <span>
          <i style={{ background: GREEN }} /> WhatsApp Order Enquiries
        </span>
      </div>
      <div className="admin-chart-box">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD} stopOpacity={0.28} />
                <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="cartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GOLD_SOFT} stopOpacity={0.24} />
                <stop offset="100%" stopColor={GOLD_SOFT} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="waFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '1px solid rgba(241,213,138,0.22)',
                background: SURFACE,
                color: '#FFFFFF',
              }}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              name="Website Visitors"
              stroke={GOLD}
              fill="url(#visitorsFill)"
              strokeWidth={2.6}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="addToCart"
              name="Add to Cart"
              stroke={GOLD_SOFT}
              fill="url(#cartFill)"
              strokeWidth={2.6}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={900}
            />
            <Area
              type="monotone"
              dataKey="whatsappEnquiries"
              name="WhatsApp Order Enquiries"
              stroke={GREEN}
              fill="url(#waFill)"
              strokeWidth={2.6}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive
              animationDuration={900}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TrafficDoughnut({ traffic }) {
  const segments = traffic?.segments || [];
  const total = Number(traffic?.totalVisitors) || 0;
  const colors = {
    direct: GOLD,
    social: GOLD_SOFT,
    search: GREEN,
    other: ORANGE,
  };

  if (!traffic?.tracked || total <= 0) {
    return (
      <div className="admin-doughnut-empty">
        <p>Traffic sources not yet tracked.</p>
        <span>Referral data will appear as visitors browse the store.</span>
      </div>
    );
  }

  const data = segments.map((segment) => ({
    ...segment,
    value: segment.visitors,
  }));

  return (
    <div className="admin-doughnut">
      <div className="admin-doughnut-visual">
        <ResponsiveContainer width="100%" height={230}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={62}
              outerRadius={86}
              paddingAngle={2}
              isAnimationActive
              animationDuration={900}
            >
              {data.map((entry) => (
                <Cell key={entry.key} fill={colors[entry.key] || ORANGE} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, _name, item) => [
                `${value} visitors (${item?.payload?.percent || 0}%)`,
                item?.payload?.label || 'Source',
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="admin-doughnut-center">
          <strong>{total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total}</strong>
          <span>Visitors</span>
        </div>
      </div>
      <ul className="admin-doughnut-legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className="swatch" style={{ background: colors[segment.key] || ORANGE }} />
            <span>{segment.label}</span>
            <strong>{segment.percent}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SalesBarChart({ series = [] }) {
  const values = series.map((row) => Number(row.salesValue) || 0);
  const hasSales = values.some((value) => value > 0);

  if (!series.length || !hasSales) {
    return <p className="admin-chart-empty">No confirmed sales in this period yet.</p>;
  }

  const bucketCount = Math.min(8, series.length);
  const bucketSize = Math.ceil(series.length / bucketCount);
  const buckets = [];
  for (let i = 0; i < series.length; i += bucketSize) {
    const slice = series.slice(i, i + bucketSize);
    buckets.push({
      label: String(slice[0]?.date || '').slice(5),
      salesValue: slice.reduce((sum, row) => sum + (Number(row.salesValue) || 0), 0),
    });
  }

  return (
    <div className="admin-chart-box">
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={buckets} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(value) => [`₦${Number(value).toLocaleString('en-NG')}`, 'Confirmed sales']}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid rgba(241,213,138,0.22)',
              background: SURFACE,
              color: '#FFFFFF',
            }}
          />
          <Bar dataKey="salesValue" fill={GOLD} radius={[8, 8, 0, 0]} isAnimationActive animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatChangeLabel(change) {
  const number = Number(change) || 0;
  const abs = Math.abs(number).toFixed(1).replace(/\.0$/, '');
  return `${number >= 0 ? '↑' : '↓'} ${abs}%`;
}

export function EngagementBars({ engagement }) {
  const rows = [
    {
      key: 'visitors',
      label: 'Website Visitors',
      display: String(engagement?.visitors?.value ?? 0),
      available: true,
      percent: Math.min(100, Number(engagement?.visitors?.value) ? 100 : 0),
      change: engagement?.visitors?.changeAvailable ? engagement.visitors.change : null,
      color: GOLD,
      hint: '',
    },
    {
      key: 'atc',
      label: 'Add to Cart Rate',
      display: engagement?.addToCartRate?.available
        ? `${engagement.addToCartRate.value}%`
        : 'Not yet available',
      available: Boolean(engagement?.addToCartRate?.available),
      percent: engagement?.addToCartRate?.available
        ? Math.min(100, Number(engagement.addToCartRate.value) || 0)
        : 0,
      change: engagement?.addToCartRate?.changeAvailable ? engagement.addToCartRate.change : null,
      color: GOLD_SOFT,
      hint: engagement?.addToCartRate?.available
        ? `${engagement.addToCartRate.numerator || 0} of ${engagement.addToCartRate.denominator || 0} visitors`
        : 'Needs recorded visitors',
    },
    {
      key: 'wa',
      label: 'WhatsApp Enquiry Rate',
      display: engagement?.whatsappEnquiryRate?.available
        ? `${engagement.whatsappEnquiryRate.value}%`
        : 'Not yet available',
      available: Boolean(engagement?.whatsappEnquiryRate?.available),
      percent: engagement?.whatsappEnquiryRate?.available
        ? Math.min(100, Number(engagement.whatsappEnquiryRate.value) || 0)
        : 0,
      change: engagement?.whatsappEnquiryRate?.changeAvailable
        ? engagement.whatsappEnquiryRate.change
        : null,
      color: GREEN,
      hint: engagement?.whatsappEnquiryRate?.available
        ? `${engagement.whatsappEnquiryRate.numerator || 0} of ${engagement.whatsappEnquiryRate.denominator || 0} visitors`
        : 'Needs recorded visitors',
    },
    {
      key: 'purchase',
      label: 'Confirmed Purchase Rate',
      display: engagement?.confirmedPurchaseRate?.available
        ? `${engagement.confirmedPurchaseRate.value}%`
        : 'Not yet available',
      available: Boolean(engagement?.confirmedPurchaseRate?.available),
      percent: engagement?.confirmedPurchaseRate?.available
        ? Math.min(100, Number(engagement.confirmedPurchaseRate.value) || 0)
        : 0,
      change: engagement?.confirmedPurchaseRate?.changeAvailable
        ? engagement.confirmedPurchaseRate.change
        : null,
      color: ORANGE,
      hint: engagement?.confirmedPurchaseRate?.available
        ? `${engagement.confirmedPurchaseRate.numerator || 0} of ${engagement.confirmedPurchaseRate.denominator || 0} visitors`
        : 'Needs confirmed orders linked to visitors',
    },
  ];

  return (
    <div className="admin-engagement-list">
      {rows.map((row) => (
        <div key={row.key} className="admin-engagement-row">
          <div className="admin-engagement-top">
            <span>{row.label}</span>
            <strong className={row.available ? undefined : 'is-muted'}>{row.display}</strong>
          </div>
          <div className="admin-progress-track">
            <span style={{ width: `${row.percent}%`, background: row.color }} />
          </div>
          <div className="admin-engagement-meta">
            {row.hint ? <em>{row.hint}</em> : <span />}
            {row.change != null ? (
              <b className={row.change >= 0 ? 'is-up' : 'is-down'}>{formatChangeLabel(row.change)}</b>
            ) : (
              <b className="is-muted">—</b>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
