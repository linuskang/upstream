"use client"

import { useState } from "react"
import { trpc } from "@/lib/trpc"
import { Form } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"
import { useParams } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

type InviteMemberForm = {
  email: string
  role: "MEMBER" | "ADMIN"
}

export function InviteMemberPopup() {
  const params = useParams()
  const projectId = String(params.id)
  const utils = trpc.useUtils()
  const [open, setOpen] = useState(false)

  const inviteMember = trpc.projectMember.invite.useMutation({
    onSuccess: async () => {
      await utils.project.list.invalidate()

      await utils.projectMember.list.invalidate()

      setOpen(false)
      toast.success("Member invited successfully")
    },

    onError: (error) => {
      toast.error(error.message)
      console.error(error)
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="primary" />}>
        Invite member
      </DialogTrigger>

      <DialogContent className="w-full max-w-md gap-0">
        <h1 className="text-lg font-semibold">Invite a new member</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a new member to the project
        </p>

        <div className="mt-6">
          <Form<InviteMemberForm>
            formOptions={{
              defaultValues: { email: "", role: "MEMBER" },
            }}
            className="space-y-4"
            onSubmit={(values: InviteMemberForm) => {
              inviteMember.mutate({
                email: values.email,
                role: values.role,
                projectId,
              })
            }}
          >
            <Form.Label className="text-sm font-medium" name="email">
              Email address
            </Form.Label>
            <Form.Field name="email" required>
              <Input
                placeholder="Email address"
                className="mt-1"
                disabled={inviteMember.isPending}
              />
            </Form.Field>

            <Form.Error className="text-sm text-destructive" name="email" />

            <Form.Label className="text-sm font-medium" name="role">
              Role
            </Form.Label>

            <Form.Field name="role" required>
              {({ field, fieldId }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={inviteMember.isPending}
                >
                  <SelectTrigger
                    id={fieldId}
                    name={field.name}
                    className="w-full"
                    onBlur={field.onBlur}
                  >
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">Member</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Form.Field>

            <Form.Submit>
              <Button variant="primary" disabled={inviteMember.isPending}>
                Invite Member
              </Button>
            </Form.Submit>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
