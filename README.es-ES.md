

# Eliminar comentarios de revisión de PR

Elimina comentarios de revisión de PR según cualquier condición. Esta acción puede eliminar tanto comentarios de revisión específicos de una línea como comentarios de revisión generales. Es útil para limpiar automáticamente comentarios obsoletos de bots de herramientas como reviewdog, dependabot o Claude Code entre ejecuciones de CI.

El token necesita el permiso `pull-requests: write`:

```yaml
permissions:
  pull-requests: write
```

## Entradas

Ver [action.yml](action.yml)

| Nombre | Descripción | Predeterminado | Requerido |
| - | - | - | - |
| `token` | GITHUB_TOKEN | `${{ github.token }}` | no |
| `bodyContains` | Elimina solo los comentarios que contengan cadenas de texto | `` | no |
| `noReply` | Elimina solo los comentarios sin respuestas (solo comentarios de revisión específicos de línea) | false | no |
| `pullRequestNumber` | Elimina comentarios en el PR especificado (detectado automáticamente desde el contexto del evento `pull_request` si se omite; requerido para otros eventos, por ejemplo `workflow_dispatch`) | `` | no |
| `usernames` | Elimina solo los comentarios publicados por los nombres de usuario especificados (separados por saltos de línea) | `` | no |
| `includeIssueComments` | Incluye los comentarios de incidencias del PR (comentarios independientes en la pestaña Conversation) entre los objetivos de eliminación | false | no |
| `includeOverallReviewComments` | Incluye los comentarios de revisión general (el texto resumen adjunto a una revisión enviada) entre los objetivos de eliminación: estos se ocultan, no se eliminan, ya que la API de GitHub no tiene forma de eliminar una revisión | false | no |
| `onlyNotMinimized` | Elimina solo los comentarios que no están minimizados (ocultos), omitiendo los comentarios ya ocultos (por ejemplo, por una ejecución anterior de `includeOverallReviewComments`) | false | no |

  Puedes especificar varias cadenas colocando cada una en su propia línea. Un comentario coincidirá si contiene **cualquiera** de las cadenas:

  ```yaml
  bodyContains: |-
    [eslint]
    [reviewdog]
  ```

  Puedes especificar varios nombres de usuario colocando cada uno en su propia línea. Un comentario coincidirá si fue publicado por **cualquiera** de los nombres de usuario listados:

  ```yaml
  usernames: |-
    dependabot[bot]
    claude[bot]
  ```

  Cuando se configuran varias entradas (`bodyContains`, `usernames`, `noReply`), un comentario debe cumplir **todas** ellas para ser eliminado.

### Notas

- Cada tipo de comentario (comentarios de revisión, comentarios de incidencias, revisiones) se recupera hasta 100 elementos; los PR con más de 100 no tendrán en cuenta los elementos más antiguos.
- Si no se puede determinar el número de PR objetivo, la acción registra una advertencia y termina sin fallar la tarea.

## Ejemplos

### Eliminar comentarios por contenido

```yaml
name: Tests
on:
  pull_request:

jobs:
  build:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          bodyContains: |-
            [eslint]
            [reviewdog]
          noReply: 'true'
      - uses: reviewdog/action-eslint@v1
```

### Eliminar comentarios por usuarios específicos

```yaml
name: Delete bot comments
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          usernames: |-
            dependabot[bot]
            claude[bot]
```

### Eliminar comentarios por contenido y usuarios

```yaml
name: Cleanup comments
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          bodyContains: 'outdated'
          usernames: 'github-actions[bot]'
          noReply: 'true'
```

### Eliminar comentarios de incidencias y comentarios de revisión general

```yaml
name: Delete review comments
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          includeIssueComments: 'true'
          includeOverallReviewComments: 'true'
          usernames: claude[bot]
```

### Eliminar solo comentarios no minimizados

```yaml
name: Delete visible comments only
on:
  pull_request:

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          bodyContains: 'outdated'
          onlyNotMinimized: 'true'
```

### Eliminar comentarios fuera de un evento `pull_request`

Cuando se activa por un evento sin contexto de PR (por ejemplo, `workflow_dispatch`), especifica `pullRequestNumber` explícitamente:

```yaml
name: Cleanup comments manually
on:
  workflow_dispatch:
    inputs:
      pr_number:
        required: true

jobs:
  cleanup:
    steps:
      - uses: aki77/delete-pr-comments-action@v3
        with:
          pullRequestNumber: ${{ inputs.pr_number }}
          usernames: claude[bot]
```
