import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Firme() {
  return (
    <>
      <Header title="Firme" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Firme — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Firme
