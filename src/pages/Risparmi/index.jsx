import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Risparmi() {
  return (
    <>
      <Header title="Risparmi" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Risparmi — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Risparmi
