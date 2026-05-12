import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'

function Note() {
  return (
    <>
      <Header title="Note" showNotification={true} />
      <PageWrapper>
        <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
          <p className="text-sm">Note — in costruzione 🚧</p>
        </div>
      </PageWrapper>
    </>
  )
}

export default Note
