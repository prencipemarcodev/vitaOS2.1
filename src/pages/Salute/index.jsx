import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Salute() {
  return (
    <>
      <Header title="Salute" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Salute — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Salute
