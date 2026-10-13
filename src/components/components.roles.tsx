import { OutsideDismissDialog } from "./UI/dialog";
import {
  selectUiState,
  setShowCreateRoleDialog,
  setShowEditRoleDialog,
} from "../features/reducers/uiReducers/uiSlice";
import { Card, CardContent } from "./UI/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./UI/form";
import { Input } from "./UI/new-input";
import { Button } from "./UI/new-button";
import { z } from "zod";
import { useAppDispatch, useAppSelector } from "../hooks/use-apps";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import {
  clearMessages,
  createRole,
  selectRoles,
  updateRole,
} from "../features/reducers/adminReducers/roleSlice";
import type { Role } from "../types/role";
import { useToast } from "./UI/use-toast";

const createRoleSchema = z.object({
  roleName: z.string().min(1, "Role name is required"),
  roleDescription: z.string(),
});

export const CreateRole = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { showCreateRoleDialog } = useAppSelector(selectUiState);
  const { success, loading, error } = useAppSelector(selectRoles);

  useEffect(() => {
    if (success.createRole) {
      form.reset();
      dispatch(clearMessages());
      dispatch(setShowCreateRoleDialog(false));
      toast({
        title: "Role Created Successfully!",
        // description: "You have been successfully logged in.",
        variant: "success",
        duration: 3000,
      });
    } else if (error.createRole) {
      console.log(error);
      toast({
        title: "Failed to create role!",
        // description: "You have been successfully logged in.",
        variant: "destructive",
        duration: 3000,
      });
    }
  }, [success, error]);

  const form = useForm<z.infer<typeof createRoleSchema>>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      roleName: "",
      roleDescription: "",
    },
  });

  async function onSubmit(data: z.infer<typeof createRoleSchema>) {
    dispatch(
      createRole({
        roleName: data.roleName,
        roleDescription: data.roleDescription,
      })
    ).catch((error) => {
      console.error("Failed to create Role:", error);
    });
  }

  return (
    <OutsideDismissDialog
      open={showCreateRoleDialog}
      onOpenChange={setShowCreateRoleDialog}
    >
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-xl mb-4">Add a new Role</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="roleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g Role 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g Role 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button // @ts-ignore
                type="submit"
                className="w-full bg-primary-blue text-white"
                loading={loading.createRole}
                disabled={loading.createRole}
              >
                Create New Role
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </OutsideDismissDialog>
  );
};

interface EditRoleProps {
  role: Role | null;
}

export const EditRole = ({ role }: EditRoleProps) => {
  const dispatch = useAppDispatch();
  const { showEditRoleDialog } = useAppSelector(selectUiState);
  const { success, loading, error } = useAppSelector(selectRoles);

  const form = useForm<z.infer<typeof createRoleSchema>>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      roleName: "",
      roleDescription: "",
    },
  });

  useEffect(() => {
    if (role && role.roleID) {
      form.reset({
        roleName: role.roleName || "",
        roleDescription: role.roleDescription || "",
      });
    }
  }, [role, form]);

  async function onSubmit(data: z.infer<typeof createRoleSchema>) {
    if (!role || !role.roleID) {
      console.error("Cannot update Role: No Role ID available");
      return;
    }

    dispatch(
      updateRole({
        id: role.roleID,
        data: {
          roleName: data.roleName,
          roleDescription: data.roleDescription,
        },
      })
    );
  }

  if (success.updateRole) {
    dispatch(clearMessages());
    dispatch(setShowEditRoleDialog(false));
  } else if (error.updateRole) {
    console.log(error.updateRole);
  }

  return (
    <OutsideDismissDialog
      open={showEditRoleDialog}
      onOpenChange={setShowEditRoleDialog}
    >
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold text-xl mb-4">Edit Role</h3>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="roleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g Role 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g Role 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button // @ts-ignore
                type="submit"
                className="w-full bg-primary-blue text-white"
                loading={loading.updateRole}
                disabled={loading.updateRole}
              >
                Edit Role
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </OutsideDismissDialog>
  );
};
