"""Audita qualidade didática dos 89 exercícios de kettlebell.
Gera score 0-100 baseado em campos obrigatórios + profundidade."""

import re
import sys
from pathlib import Path
from collections import defaultdict

SEED = Path('frontend/src/data/seed/exercicios-kettlebell.ts')
OUTPUT = Path('docs/sprints/2026-09-23-roadmap/AUDIT-EXERCICIOS-2026-09-23.md')

# Pesos por critério (total = 100)
PESOS = {
    'mapa_muscular_size': 15,  # >=4 itens
    'sensacao_presente': 8,
    'erro_muscular': 8,
    'analogia_inicial': 6,
    'carga_inicial': 6,
    'alerta_50mais': 5,
    'contra_indicacoes': 3,
    'evidencia': 3,
    'passos_quantidade': 10,  # >=4 steps
    'passo_descricao': 10,   # descricao >=80 chars
    'passo_cues': 6,          # >=2 cues
    'passo_sensacoes': 10,    # >=2 sensacoes
    'passo_alertas': 5,       # >=1 alerta
    'imagem_existe': 5,
}

def parse_exercicios(text):
    """Extrai todos os exercícios do seed."""
    exercicios = []
    # Cada exercício é um bloco que começa com "    id: 'kb-...'"
    chunks = re.split(r"(?=    id: 'kb-)", text)
    for chunk in chunks:
        if "id: 'kb-" not in chunk:
            continue
        m_id = re.search(r"id: '([^']+)'", chunk)
        m_nome = re.search(r"nome: '([^']+)'", chunk)
        m_padrao = re.search(r"padraoKb: '([^']+)'", chunk)
        m_nivel = re.search(r"nivel: '([^']+)'", chunk)
        if not (m_id and m_nome):
            continue
        exercicios.append({
            'id': m_id.group(1),
            'nome': m_nome.group(1),
            'padrao': m_padrao.group(1) if m_padrao else '?',
            'nivel': m_nivel.group(1) if m_nivel else '?',
            'block': chunk,
        })
    return exercicios

def extract_field(text, field):
    m = re.search(rf"\b{field}:\s*\[([^\]]+)\]", text)
    if not m:
        return []
    items = re.findall(r"'((?:[^'\\]|\\.)*)'", m.group(1))
    return items

def extract_steps(text):
    """Extrai todos os steps do bloco."""
    steps = []
    pattern = r"\{\s*numero:\s*(\d+),\s*titulo:\s*'([^']+)',\s*descricao:\s*'([^']+)'"
    for m in re.finditer(pattern, text):
        step_start = m.end()
        # Pegar até o próximo "{ numero:" (próximo step) ou até o fim do objeto
        rest = text[step_start:step_start + 3000]
        next_step = rest.find('{ numero:')
        if next_step > -1:
            step_body = rest[:next_step]
        else:
            # É o último step - pegar até o "imagem: { ... } }," ou fim
            # Heurística: pegar até a próxima quebra de indent (4 espaços) que vem após uma vírgula
            # Vou pegar 1500 chars (mais que suficiente)
            step_body = rest[:1500]
        steps.append({
            'numero': int(m.group(1)),
            'titulo': m.group(2),
            'descricao': m.group(3),
            'cues': extract_field(step_body, 'cues'),
            'sensacoes': extract_field(step_body, 'sensacoes'),
            'alertas': extract_field(step_body, 'alertasMusculares'),
        })
    return steps

def check_simple_field(text, field):
    """Verifica se campo simples existe e não está vazio."""
    m = re.search(rf"\b{field}:\s*'([^']*)'", text)
    return bool(m and m.group(1).strip())

def score_exercicio(ex):
    """Calcula score 0-100 do exercício."""
    block = ex['block']
    steps = extract_steps(block)
    points = {}
    details = {}

    # mapaMuscularLeigo size
    mapa = extract_field(block, 'mapaMuscularLeigo')
    details['mapa_size'] = len(mapa)
    points['mapa_muscular_size'] = PESOS['mapa_muscular_size'] if len(mapa) >= 4 else (len(mapa) * PESOS['mapa_muscular_size'] // 4)

    # Campos simples
    points['sensacao_presente'] = PESOS['sensacao_presente'] if check_simple_field(block, 'sensacaoPrincipal') else 0
    points['erro_muscular'] = PESOS['erro_muscular'] if check_simple_field(block, 'erroMuscular') else 0
    points['analogia_inicial'] = PESOS['analogia_inicial'] if check_simple_field(block, 'analogiaInicial') else 0
    points['carga_inicial'] = PESOS['carga_inicial'] if check_simple_field(block, 'cargaInicial50mais') else 0
    points['alerta_50mais'] = PESOS['alerta_50mais'] if check_simple_field(block, 'alerta50mais') else 0
    points['contra_indicacoes'] = PESOS['contra_indicacoes'] if check_simple_field(block, 'contraIndicacoes') else 0
    points['evidencia'] = PESOS['evidencia'] if check_simple_field(block, 'evidencia') else 0

    # Steps
    n_steps = len(steps)
    details['n_steps'] = n_steps
    points['passos_quantidade'] = PESOS['passos_quantidade'] if n_steps >= 4 else (n_steps * PESOS['passos_quantidade'] // 4)

    if steps:
        # Descrição
        desc_min = min(len(s['descricao']) for s in steps)
        details['desc_min_chars'] = desc_min
        if desc_min >= 80:
            points['passo_descricao'] = PESOS['passo_descricao']
        else:
            points['passo_descricao'] = (desc_min * PESOS['passo_descricao'] // 80)
        # Cues
        cues_min = min(len(s['cues']) for s in steps)
        details['cues_min'] = cues_min
        if cues_min >= 2:
            points['passo_cues'] = PESOS['passo_cues']
        else:
            points['passo_cues'] = (cues_min * PESOS['passo_cues'] // 2)
        # Sensações
        sens_min = min(len(s['sensacoes']) for s in steps)
        details['sens_min'] = sens_min
        if sens_min >= 2:
            points['passo_sensacoes'] = PESOS['passo_sensacoes']
        else:
            points['passo_sensacoes'] = (sens_min * PESOS['passo_sensacoes'] // 2)
        # Alertas
        alert_min = min(len(s['alertas']) for s in steps)
        details['alert_min'] = alert_min
        if alert_min >= 1:
            points['passo_alertas'] = PESOS['passo_alertas']
        else:
            points['passo_alertas'] = 0
    else:
        details['desc_min_chars'] = 0
        details['cues_min'] = 0
        details['sens_min'] = 0
        details['alert_min'] = 0
        points['passo_descricao'] = 0
        points['passo_cues'] = 0
        points['passo_sensacoes'] = 0
        points['passo_alertas'] = 0

    # Imagem
    img_path = Path('frontend/public/kettlebell/step-images') / f"{ex['id']}-step-1.png"
    points['imagem_existe'] = PESOS['imagem_existe'] if img_path.exists() else 0

    total = sum(points.values())
    return {
        'score': total,
        'points': points,
        'details': details,
        'steps': steps,
    }

def main():
    if not SEED.exists():
        print(f'❌ Seed não encontrado: {SEED}')
        sys.exit(1)

    text = SEED.read_text()
    exercicios = parse_exercicios(text)
    print(f'📊 {len(exercicios)} exercícios encontrados')

    # Auditar
    results = []
    for ex in exercicios:
        r = score_exercicio(ex)
        results.append({**ex, **r})

    # Estatísticas
    scores = [r['score'] for r in results]
    avg_score = sum(scores) / len(scores)
    min_score = min(scores)
    max_score = max(scores)
    below_80 = [r for r in results if r['score'] < 80]
    perfect = [r for r in results if r['score'] >= 95]

    print(f'\\n📈 Score médio: {avg_score:.1f}/100')
    print(f'📉 Score mínimo: {min_score}/100')
    print(f'📈 Score máximo: {max_score}/100')
    print(f'⚠️  Abaixo de 80: {len(below_80)}/{len(results)}')
    print(f'✅ Perfeitos (>=95): {len(perfect)}/{len(results)}')

    # Agrupar por padrão
    by_padrao = defaultdict(list)
    for r in results:
        by_padrao[r['padrao']].append(r)

    # Gerar relatório
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    lines.append('# Auditoria de Qualidade — 89 Exercícios')
    lines.append('')
    lines.append(f'**Data:** 2026-09-23')
    lines.append(f'**Total:** {len(results)} exercícios')
    lines.append('')
    lines.append('## Resumo')
    lines.append('')
    lines.append(f'- **Score médio:** {avg_score:.1f}/100')
    lines.append(f'- **Score mínimo:** {min_score}/100 (`{min(results, key=lambda r: r["score"])["id"]}`)')
    lines.append(f'- **Score máximo:** {max_score}/100')
    lines.append(f'- **Abaixo de 80:** {len(below_80)}/{len(results)} ({len(below_80)/len(results)*100:.0f}%)')
    lines.append(f'- **Perfeitos (>=95):** {len(perfect)}/{len(results)} ({len(perfect)/len(results)*100:.0f}%)')
    lines.append('')

    # Por padrão
    lines.append('## Distribuição por padrão KB')
    lines.append('')
    lines.append('| Padrão | Qtd | Score médio |')
    lines.append('|--------|-----|-------------|')
    for padrao in sorted(by_padrao.keys()):
        scores_p = [r['score'] for r in by_padrao[padrao]]
        lines.append(f'| {padrao} | {len(scores_p)} | {sum(scores_p)/len(scores_p):.1f} |')
    lines.append('')

    # Tabela completa
    lines.append('## Todos os exercícios (ordenado por score)')
    lines.append('')
    lines.append('| # | ID | Nome | Padrão | Nível | Score | Mapa | Steps | Desc.min |')
    lines.append('|---|----|------|---------|-------|-------|------|-------|----------|')
    for i, r in enumerate(sorted(results, key=lambda x: x['score']), 1):
        emoji = '✅' if r['score'] >= 80 else '⚠️'
        lines.append(f'| {i} | `{r["id"]}` | {r["nome"][:30]} | {r["padrao"]} | {r["nivel"][:5]} | {emoji} {r["score"]} | {r["details"]["mapa_size"]} | {r["details"]["n_steps"]} | {r["details"]["desc_min_chars"]} |')
    lines.append('')

    # Críticos (score < 80)
    if below_80:
        lines.append('## ⚠️ Críticos (score < 80)')
        lines.append('')
        for r in below_80:
            lines.append(f'### `{r["id"]}` — {r["nome"]} ({r["score"]}/100)')
            lines.append('')
            lines.append(f'- **Padrão:** {r["padrao"]} | **Nível:** {r["nivel"]}')
            lines.append(f'- **mapaMuscularLeigo:** {r["details"]["mapa_size"]} itens (mínimo: 4)')
            lines.append(f'- **Steps:** {r["details"]["n_steps"]} (mínimo: 4)')
            lines.append(f'- **Desc.min:** {r["details"]["desc_min_chars"]} chars (mínimo: 80)')
            lines.append(f'- **Sensações min/step:** {r["details"]["sens_min"]} (mínimo: 2)')
            lines.append(f'- **Pontos fracos:**')
            for k, v in r['points'].items():
                max_p = PESOS[k]
                if v < max_p:
                    lines.append(f'  - {k}: {v}/{max_p}')
            lines.append('')

    OUTPUT.write_text('\\n'.join(lines))
    print(f'\\n✅ Relatório salvo em {OUTPUT}')

if __name__ == '__main__':
    main()
