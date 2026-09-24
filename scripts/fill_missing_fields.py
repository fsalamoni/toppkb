"""
Sprint 69.2 — Adiciona alerta50mais e contraIndicacoes nos exercícios que não têm.

Para cada exercício sem esses campos:
- alerta50mais: template baseado no padrão KB
- contraIndicacoes: lista comum

Idempotente: se já tem, não sobrescreve.
"""
import re

with open('frontend/src/data/seed/exercicios-kettlebell.ts') as f:
    content = f.read()

# Templates por padrão KB
ALERTA_TEMPLATES = {
    'HINGE': [
        '⚠️ 50+: Swing exige aquecimento lombar antes. Se sentir dor lombar AGUDA: pare. Para iniciantes: começar SEM KB (apenas bodyweight hip hinge). Subir carga progressivamente com técnica dominada.',
        '⚠️ 50+: NÃO use carga pesada antes de dominar técnica. Lesão lombar é o risco principal. Se tiver hérnia ou protrusão: substitua por Good Morning com isometria.',
    ],
    'SQUAT': [
        '⚠️ 50+: Agachamento com KB exige joelho saudável. Se tiver artrose avançada ou prótese: use agachamento na cadeira (Box Squat). Profundidade: até onde quadril ficar abaixo do joelho SEM dor.',
        '⚠️ 50+: Joelho NÃO deve passar ALÉM DA PONTA DO PÉ (em mulheres é comum, mas atenção à pressão no joelho). Use espelho para ver.',
    ],
    'PRESS': [
        '⚠️ 50+: Press exige ombro saudável. Se tiver lesão no manguito rotador: substitua por Floor Press. Carga inicial: 8 kg, máximo 12 kg até dominar 4 semanas.',
        '⚠️ 50+: NÃO pressione overhead se tiver capsulite ou dor crônica no ombro. Comece com 1 braço só (mais leve).',
    ],
    'PULL': [
        '⚠️ 50+: Row é mais seguro que Pull-up para iniciantes. Se tiver hérnia cervical: NÃO use carga, apenas bodyweight. Para coluna: manter core travado SEMPRE.',
        '⚠️ 50+: Se tiver problema no punho: use strap ou guidão. Lats (latíssimo) alongam durante pull-up — não force amplitude máxima se sentir fisgadas.',
    ],
    'CARRY': [
        '⚠️ 50+: Carry exige antebraço forte. Se tiver tendinite: usar peso leve. Comece com 8 kg e ande 20m SEM parar. Respiração: inspire 2 passos, expire 2 passos.',
        '⚠️ 50+: NÃO use carga pesada — risco de queda se antebraço falhar. Walk com KB overhead exige ombro íntegro.',
    ],
    'ROT': [
        '⚠️ 50+: Movimentos rotacionais (TGU, Windmill) exigem mobilidade. Se tiver limitação no quadril ou ombro: limitar amplitude. Carga inicial: 8 kg.',
        '⚠️ 50+: NÃO force amplitude total. TGU completo exige anos de prática. Foque em amplitude MENOR com carga zero.',
    ],
    'COND': [
        '⚠️ 50+: Condicionamento é progressivo. Comece com 3 rounds, não 5. Recuperar frequência cardíaca em 60s. Se tiver pressão alta: substitua por caminhada rápida.',
        '⚠️ 50+: HIIT com KB é alta intensidade. Cardiopatia ou hipertensão descontrolada: substituir por circuito moderado.',
    ],
    'FLOW': [
        '⚠️ 50+: Flows exigem técnica dominada em CADA movimento individual. Se tiver dúvida em qualquer componente: praticar isolado antes. Carga: a menor que permita manter ritmo.',
        '⚠️ 50+: Flow com carga alta é exclusivo para avançados. Para 50+: começar SEM KB, dominar ritmo, adicionar carga progressivamente.',
    ],
}

# contraIndicacoes comuns
CI_COMMON = {
    'HINGE': ['Lesão lombar aguda', 'Hérnia de disco sintomática', 'Estenose espinhal', 'Cirurgia lombar recente (< 6 meses)'],
    'SQUAT': ['Artrose avançada de joelho', 'Prótese de joelho', 'Lesão de menisco', 'Dor patelofemoral crônica'],
    'PRESS': ['Capsulite adesiva', 'Lesão do manguito rotador', 'Dor crônica no ombro', 'Lesão no pescoço'],
    'PULL': ['Hérnia cervical', 'Lesão no punho / túnel do carpo', 'Tendinite crônica', 'Cirurgia no ombro recente'],
    'CARRY': ['Tendinite crônica no antebraço', 'Lesão no ombro', 'Problema na cervical', 'Fratura recente no punho'],
    'ROT': ['Lesão no quadril', 'Capsulite adesiva', 'Hérnia lombar', 'Limitação severa de mobilidade'],
    'COND': ['Cardiopatia descompensada', 'Hipertensão não controlada', 'Obesidade mórbida', 'Artrose severa'],
    'FLOW': ['Qualquer contraindicação dos componentes individuais', 'Iniciante absoluto (aprender isolados antes)'],
}

# Processar cada chunk
chunks = re.split(r"(?=    id: 'kb-)", content)
new_content = content
total_added_a = 0
total_added_ci = 0

for chunk in chunks:
    if 'id: \'' not in chunk:
        continue
    id_m = re.search(r"id:\s*'(kb-[^']+)'", chunk)
    p_m = re.search(r"padraoKb:\s*'([^']+)'", chunk)
    if not (id_m and p_m):
        continue
    ex_id = id_m.group(1)
    padrao = p_m.group(1)

    needs_a = 'alerta50mais' not in chunk
    needs_ci = 'contraIndicacoes' not in chunk

    if not (needs_a or needs_ci):
        continue

    # Gerar blocos para adicionar
    insert_text = ''
    if needs_a:
        # Pegar template com base no nome do exercício
        nome_m = re.search(r"nome:\s*'([^']+)'", chunk)
        nome = nome_m.group(1) if nome_m else ''
        # Usar template mais relevante
        alerta = ALERTA_TEMPLATES.get(padrao, [''])[0]
        insert_text += f"    alerta50mais: '{alerta}',\n"
        total_added_a += 1

    if needs_ci:
        ci_list = CI_COMMON.get(padrao, [])
        ci_items = ", ".join(f"'{c}'" for c in ci_list)
        insert_text += f"    contraIndicacoes: [{ci_items}],\n"
        total_added_ci += 1

    # Inserir antes de fontesExternas ou evidências
    # Procurar onde colocar
    if 'fontesExternas:' in chunk:
        ins_pos_in_chunk = chunk.rfind('    fontesExternas:')
    elif 'evidencia:' in chunk:
        ins_pos_in_chunk = chunk.rfind('    evidencia:')
    else:
        ins_pos_in_chunk = chunk.rfind('  },')

    if ins_pos_in_chunk <= 0:
        continue

    new_chunk = chunk[:ins_pos_in_chunk] + insert_text + chunk[ins_pos_in_chunk:]
    # Replace no content
    # Localizar este chunk no content original
    chunk_start = new_content.find(chunk)
    if chunk_start == -1:
        # Pode ter caracteres diferentes; usar match via ID
        idx = new_content.find(ex_id)
        # Não confiável. Pular.
        continue
    chunk_end = chunk_start + len(chunk)
    new_content = new_content[:chunk_start] + new_chunk + new_content[chunk_end:]
    # Reset para próxima iteração (cuidado com offset)
    content = new_content
    new_content = content

# Salvar
if total_added_a > 0 or total_added_ci > 0:
    with open('frontend/src/data/seed/exercicios-kettlebell.ts', 'w') as f:
        f.write(content)
    print(f'✅ Adicionados alerta50mais em {total_added_a} exercícios')
    print(f'✅ Adicionados contraIndicacoes em {total_added_ci} exercícios')
else:
    print('Nada a adicionar (já estão preenchidos)')
