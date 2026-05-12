import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Calendario() {
  return (
    <>
      <Header title="Calendario" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Calendario — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Calendario
