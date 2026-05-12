import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Finanze() {
  return (
    <>
      <Header title="Finanze" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Finanze — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Finanze
