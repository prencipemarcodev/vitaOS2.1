import { useNavigate } from 'react-router-dom'
import { Car, ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

/**
 * VehicleSection — spostata nel menu principale come pagina dedicata.
 * Questo componente mostra solo un redirect informativo.
 */
function VehicleSection() {
  const navigate = useNavigate()

  return (
    <Card padding="lg" className="border-[var(--color-primary)]/15 bg-[var(--color-primary-ghost)]">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-ghost)] flex items-center justify-center shrink-0">
          <Car size={20} className="text-[var(--color-primary)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-[var(--text-primary)] mb-1">
            Il Garage è stato spostato
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
            La sezione veicolo è ora una pagina dedicata nel menu principale.
            Puoi gestire più auto, tracciare spese, manutenzioni e consumo direttamente dal Garage.
          </p>
          <Button
            variant="primary"
            size="sm"
            icon={Car}
            iconRight={ArrowRight}
            onClick={() => navigate('/veicolo')}
          >
            Vai al Garage
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default VehicleSection
