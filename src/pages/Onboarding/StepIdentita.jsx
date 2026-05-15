import { useState } from 'react'
import Input from '@/components/ui/Input'
import { User } from 'lucide-react'

export default function StepIdentita({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Chi sei?
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Iniziamo dando un nome al tuo sistema operativo personale.
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nome"
          placeholder="es. Marco"
          icon={User}
          value={formData.first_name}
          onChange={(e) => updateFormData({ first_name: e.target.value })}
          required
        />
        <Input
          label="Cognome"
          placeholder="es. Bianchi"
          icon={User}
          value={formData.last_name}
          onChange={(e) => updateFormData({ last_name: e.target.value })}
          required
        />
      </div>

      <div className="p-4 bg-[var(--color-primary-ghost)] rounded-[var(--radius-md)] border border-[var(--color-primary-light)]/20">
        <p className="text-xs text-[var(--color-primary-dark)] font-medium leading-relaxed">
          <strong>Nota:</strong> Inserendo il tuo nome, l'applicazione si trasformerà in 
          <span className="font-bold"> {formData.first_name || '...'}OS</span>.
        </p>
      </div>
    </div>
  )
}
