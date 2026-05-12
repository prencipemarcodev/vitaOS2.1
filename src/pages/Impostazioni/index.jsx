import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Impostazioni() {
  return (
    <>
      <Header title="Impostazioni" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Impostazioni — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Impostazioni
