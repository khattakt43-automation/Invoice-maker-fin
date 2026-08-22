import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Percent,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  Check
} from 'lucide-react';
import { Product, Tenant } from '../types';

interface ProductsViewProps {
  tenant: Tenant;
  products: Product[];
  onProductAdded: (prod: Product) => void;
  onProductUpdated?: (prod: Product) => void;
  onProductDeleted?: (prodId: string) => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  tenant,
  products,
  onProductAdded,
  onProductUpdated,
  onProductDeleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Software');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('unit');
  const [unitPrice, setUnitPrice] = useState<number>(500);
  const [taxRate, setTaxRate] = useState<number>(0.08);
  const [description, setDescription] = useState('');

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory('Software');
    setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setUnit('unit');
    setUnitPrice(500);
    setTaxRate(0.08);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setSku(prod.sku);
    setUnit(prod.unit);
    setUnitPrice(prod.unitPrice);
    setTaxRate(prod.taxRate);
    setDescription(prod.description);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name,
        category,
        sku: sku || editingProduct.sku,
        unit,
        unitPrice: Number(unitPrice) || 0,
        taxRate: Number(taxRate) || 0,
        description,
      };
      if (onProductUpdated) {
        onProductUpdated(updated);
      }
    } else {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        tenantId: tenant.id,
        name,
        category,
        sku: sku || `SKU-${Math.floor(100 + Math.random() * 900)}`,
        unit,
        unitPrice: Number(unitPrice) || 0,
        taxRate: Number(taxRate) || 0,
        description,
      };
      onProductAdded(newProd);
    }

    setIsModalOpen(false);
    setEditingProduct(null);
    setName('');
    setDescription('');
  };

  const handleDelete = (prodId: string) => {
    if (onProductDeleted) {
      onProductDeleted(prodId);
    }
    setDeleteConfirmId(null);
  };

  return (
    <div id="products-view" className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-[#0b1c30] tracking-tight">Products & Services</h2>
          <p className="text-sm text-[#545f73]">
            Standardized catalog items, pricing units, and default Malaysian SST tax codes
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#006a46] text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-[#00855a] transition-all shadow-sm active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Search & Stats */}
      <div className="bg-white p-4 rounded-2xl border border-[#bdcac0]/60 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#545f73]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, SKU, category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#f8f9ff] border border-[#bdcac0] text-xs text-[#0b1c30] focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46] outline-none"
          />
        </div>
        <div className="text-xs text-[#545f73] font-medium flex items-center gap-2">
          <span>Total Catalog Items: <strong className="text-[#0b1c30] font-mono">{products.length}</strong></span>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#bdcac0]/60 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#eff4ff] text-[#006a46] flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#0b1c30] text-base">No Products Found</h3>
          <p className="text-xs text-[#545f73] max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search criteria.' : 'Add items to your product catalog for 1-click line item entry on invoices.'}
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-2 bg-[#006a46] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#00855a] transition-all inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-2xl border border-[#bdcac0]/60 p-6 shadow-xs flex flex-col justify-between hover:shadow-md transition-all space-y-4 group relative"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-[#eff4ff] text-[#006a46] border border-[#00855a]/20">
                    {prod.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-[#545f73] mr-1">{prod.sku}</span>
                    <button
                      onClick={() => handleOpenEditModal(prod)}
                      title="Edit Product"
                      className="p-1.5 rounded-lg text-[#545f73] hover:text-[#006a46] hover:bg-[#eff4ff] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(prod.id)}
                      title="Delete Product"
                      className="p-1.5 rounded-lg text-[#545f73] hover:text-[#ba1a1a] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-base text-[#0b1c30] group-hover:text-[#006a46] transition-colors">
                  {prod.name}
                </h3>
                <p className="text-xs text-[#545f73] leading-relaxed line-clamp-2 min-h-[32px]">
                  {prod.description || 'Standard catalog item for tax invoicing.'}
                </p>
              </div>

              <div className="pt-4 border-t border-[#bdcac0]/40 flex justify-between items-end">
                <div>
                  <span className="text-[10px] text-[#545f73] uppercase font-semibold">Unit Price</span>
                  <div className="font-mono text-xl font-bold text-[#006a46]">
                    RM {prod.unitPrice.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-[#545f73]"> /{prod.unit}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-mono font-semibold px-2 py-1 bg-[#f8f9ff] border border-[#bdcac0]/40 rounded-md text-[#3e4942]">
                    {prod.taxRate > 0 ? `${(prod.taxRate * 100).toFixed(0)}% SST` : '0% Tax'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 p-5 space-y-4">
            <div className="flex items-center gap-3 text-[#ba1a1a]">
              <div className="p-2.5 rounded-xl bg-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0b1c30] text-base">Delete Product?</h3>
                <p className="text-xs text-[#545f73]">This item will be removed from your active catalog.</p>
              </div>
            </div>
            <div className="p-3 bg-[#f8f9ff] rounded-xl border border-[#bdcac0]/40 text-xs font-semibold text-[#0b1c30]">
              {products.find((p) => p.id === deleteConfirmId)?.name}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#545f73] hover:bg-[#eff4ff] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ba1a1a] hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#213145]/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-[#bdcac0]/60 flex flex-col">
            <div className="p-5 border-b border-[#bdcac0]/40 flex justify-between items-center bg-[#eff4ff]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#00855a]/10 text-[#006a46] flex items-center justify-center font-bold">
                  {editingProduct ? <Edit2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-[#0b1c30]">
                    {editingProduct ? 'Edit Catalog Item' : 'Add Catalog Item'}
                  </h3>
                  <p className="text-xs text-[#545f73]">Standard item for instant invoice line entry</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-[#545f73] hover:text-[#0b1c30] p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#3e4942] uppercase mb-1">
                  Product / Service Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cloud Security Assessment"
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006a46]/20 focus:border-[#006a46]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3e4942] uppercase mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] outline-none cursor-pointer"
                  >
                    <option value="Software">Software</option>
                    <option value="Services">Services</option>
                    <option value="Retainer">Retainer</option>
                    <option value="Development">Development</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3e4942] uppercase mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="SRV-SEC-01"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#3e4942] uppercase mb-1">Unit Price (RM) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3e4942] uppercase mb-1">Unit Type</label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="unit, hrs, pcs, meter"
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm font-mono text-[#0b1c30] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3e4942] uppercase mb-1">Tax Rate</label>
                  <select
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] outline-none cursor-pointer"
                  >
                    <option value={0.08}>8% SST</option>
                    <option value={0.06}>6% Service Tax</option>
                    <option value={0}>0% Tax (Exempt)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3e4942] uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Service breakdown for invoice line item notes..."
                  className="w-full bg-[#f8f9ff] border border-[#bdcac0] rounded-lg p-2.5 text-sm text-[#0b1c30] outline-none resize-none"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-[#bdcac0]/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#545f73] hover:bg-[#eff4ff] rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#006a46] text-white px-5 py-2 rounded-lg text-xs font-semibold hover:bg-[#00855a] shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingProduct ? 'Save Changes' : 'Add Item'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
