import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Overview() {
  return (
    <>
      <Header title="Overview" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Overview — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Overview
