import type React from "react";

import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks/use-apps";
import {
  createProduct,
  selectProducts,
} from "../../features/reducers/productReducers/productSlice";
import { Button } from "../UI/new-button";
import { Input } from "../UI/new-input";
import { Label } from "../UI/label";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../UI/dialog";
import { useToast } from "../UI/use-toast";
import { OutsideDismissDialog } from "../UI/dialog";
import type { ProductCreateUpdateRequest } from "../../types/product";

interface ProductCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskId: string;
}

const ProductCreateModal = ({
  isOpen,
  onClose,
}: ProductCreateModalProps) => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const { loading, error, success } = useAppSelector(selectProducts);

  const [formData, setFormData] = useState<ProductCreateUpdateRequest>({
    productID: "",
    classID: "",
    midClassID: "",
    productName: "",
    shortName: "",
    naicomTypeID: "",
  });

  const [errors, setErrors] = useState<Partial<ProductCreateUpdateRequest>>({});

  useEffect(() => {
    if (success.createProduct) {
      toast({
        title: "Product Created!",
        description: "The product has been successfully created.",
        variant: "success",
        duration: 3000,
      });
      onClose();
      resetForm();
    } else if (error.createProduct) {
      toast({
        description: "Failed to create product. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }
  }, [success.createProduct, error.createProduct, toast, onClose]);

  const resetForm = () => {
    setFormData({
      productID: "",
      classID: "",
      midClassID: "",
      productName: "",
      shortName: "",
      naicomTypeID: "",
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Partial<ProductCreateUpdateRequest> = {};

    if (!formData.productName.trim()) {
      newErrors.productName = "Product name is required";
    }
    if (!formData.shortName.trim()) {
      newErrors.shortName = "Short name is required";
    }
    if (!formData.classID.trim()) {
      newErrors.classID = "Class ID is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    dispatch(createProduct(formData));
  };

  const handleInputChange = (
    field: keyof ProductCreateUpdateRequest,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <OutsideDismissDialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 pt-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={formData.productName}
                onChange={(e) =>
                  handleInputChange("productName", e.target.value)
                }
                placeholder="Enter product name"
                className={errors.productName ? "border-red-500" : ""}
              />
              {errors.productName && (
                <p className="text-sm text-red-500">{errors.productName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name *</Label>
              <Input
                id="shortName"
                value={formData.shortName}
                onChange={(e) => handleInputChange("shortName", e.target.value)}
                placeholder="Enter short name"
                className={errors.shortName ? "border-red-500" : ""}
              />
              {errors.shortName && (
                <p className="text-sm text-red-500">{errors.shortName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="classID">Class ID *</Label>
              <Input
                id="classID"
                value={formData.classID}
                onChange={(e) => handleInputChange("classID", e.target.value)}
                placeholder="Enter class ID"
                className={errors.classID ? "border-red-500" : ""}
              />
              {errors.classID && (
                <p className="text-sm text-red-500">{errors.classID}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="midClassID">Mid Class ID</Label>
              <Input
                id="midClassID"
                value={formData.midClassID}
                onChange={(e) =>
                  handleInputChange("midClassID", e.target.value)
                }
                placeholder="Enter mid class ID"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productID">Product ID</Label>
              <Input
                id="productID"
                value={formData.productID}
                onChange={(e) => handleInputChange("productID", e.target.value)}
                placeholder="Enter product ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="naicomTypeID">Naicom Type ID</Label>
              <Input
                id="naicomTypeID"
                value={formData.naicomTypeID}
                onChange={(e) =>
                  handleInputChange("naicomTypeID", e.target.value)
                }
                placeholder="Enter naicom type ID"
              />
            </div>
          </div>

          <div className="gap-2 flex">
            <Button   //@ts-ignore
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading.createProduct}
            >
              Cancel
            </Button>
            <Button   //@ts-ignore
              type="submit"
              className="flex-1 bg-primary-blue text-white"
              disabled={loading.createProduct}
            >
              {loading.createProduct ? "Creating..." : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </OutsideDismissDialog>
  );
};

export default ProductCreateModal;
