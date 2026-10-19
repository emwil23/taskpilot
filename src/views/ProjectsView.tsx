import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { TaskList } from '@/components/TaskList'
import { Button } from '@/components/ui/button'
import { useAllTasks, useProjects } from '@/hooks/data'
import { db } from '@/lib/db'
import { byOrder, createProject } from '@/lib/tasks'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export function ProjectsView() {
  const projects = useProjects()
  const tasks = useAllTasks()
  const [name, setName] = useState('')

  return (
    <>
      <PageHeader eyebrow="Areas" title="Projects" />
      <form
        className="mb-8 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return
          void createProject(name.trim())
          setName('')
        }}
      >
        <label htmlFor="project-name" className="sr-only">
          New project name
        </label>
        <input
          id="project-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project"
          className="border-line bg-bg focus:border-accent h-10 flex-1 rounded-xl border px-3 text-sm outline-none"
        />
        <Button type="submit" variant="primary">
          <Plus /> Create
        </Button>
      </form>
      {projects?.length === 0 && (
        <EmptyState art="board" title="No projects yet">
          Create one here, or type #name in quick add.
        </EmptyState>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects?.map((p) => {
          const mine = tasks?.filter((t) => t.projectId === p.id) ?? []
          const done = mine.filter((t) => t.status === 'done').length
          const pct = mine.length ? Math.round((done / mine.length) * 100) : 0
          return (
            <li key={p.id}>
              <Link
                to="/app/projects/$projectId"
                params={{ projectId: p.id }}
                className="border-line bg-surface/50 hover:border-muted block rounded-2xl border p-5 transition-colors"
              >
                <span className="mb-4 block size-3 rounded-full" style={{ background: p.color }} />
                <span className="font-display block text-lg font-semibold">{p.name}</span>
                <span className="hud text-muted mt-1 block">
                  {mine.length - done} open · {done} done
                </span>
                <span
                  className="bg-line mt-4 block h-1.5 overflow-hidden rounded-full"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${p.name} progress`}
                >
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${pct}%`, background: p.color }}
                  />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export function ProjectView() {
  const { projectId } = useParams({ from: '/shell/app/projects/$projectId' })
  const projects = useProjects()
  const tasks = useAllTasks()
  const navigate = useNavigate()
  const project = projects?.find((p) => p.id === projectId)
  if (!projects || !tasks) return null
  if (!project) return <EmptyState art="board" title="Project not found" />

  const mine = tasks.filter((t) => t.projectId === projectId).sort(byOrder)
  const open = mine.filter((t) => t.status !== 'done')
  const done = mine.filter((t) => t.status === 'done')

  async function remove() {
    if (!project) return
    if (!confirm(`Delete "${project.name}"? Its ${mine.length} tasks move to the Inbox.`)) return
    await db.transaction('rw', db.tasks, db.projects, async () => {
      await db.tasks.where('projectId').equals(project.id).modify({ projectId: null })
      await db.projects.delete(project.id)
    })
    toast(`Deleted ${project.name}`)
    void navigate({ to: '/app/projects' })
  }

  return (
    <>
      <PageHeader eyebrow="Project" title={project.name}>
        <Button variant="danger" size="sm" onClick={() => void remove()}>
          <Trash2 /> Delete project
        </Button>
      </PageHeader>
      <TaskList
        tasks={open}
        label={project.name}
        empty={
          <EmptyState art="inbox" title="Nothing open here">
            Press Q to add a task to this project.
          </EmptyState>
        }
      />
      {done.length > 0 && (
        <details className="mt-8">
          <summary className="hud text-muted cursor-pointer">Done · {done.length}</summary>
          <div className="mt-2">
            <TaskList tasks={done} label={`${project.name} done`} />
          </div>
        </details>
      )}
    </>
  )
}
