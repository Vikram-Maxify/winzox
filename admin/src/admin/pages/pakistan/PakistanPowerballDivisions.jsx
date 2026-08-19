import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Plus,
  Pencil,
  Trash2,
  Power,
  RefreshCw,
  X,
} from "lucide-react";

import {
  getAllDivisions,
  createDivision,
  updateDivision,
  deleteDivision,
  toggleDivisionStatus,
  clearDivisionMessage,
} from "../../redux/pakistan/PakistanPowerballDivisionSlice";

const initialForm = {
  division: "",
  main: "",
  powerball: false,
  prize: "",
  isActive: true,
};

const PakistanPowerballDivisions = () => {
  const dispatch = useDispatch();

  const {
    divisions = [],
    loading,
    error,
    success,
    message,
  } = useSelector(
    (state) => state.pakistanPowerballDivision || {}
  );

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(getAllDivisions());
  }, [dispatch]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        dispatch(clearDivisionMessage());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, error, dispatch]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      division: Number(form.division),
      main: Number(form.main),
      powerball: Boolean(form.powerball),
      prize: Number(form.prize),
      isActive: Boolean(form.isActive),
    };

    if (editingId) {
      const result = await dispatch(
        updateDivision({
          id: editingId,
          data: payload,
        })
      );

      if (!result.error) {
        resetForm();
      }
    } else {
      const result = await dispatch(
        createDivision(payload)
      );

      if (!result.error) {
        resetForm();
      }
    }
  };

  const handleEdit = (division) => {
    setEditingId(division._id);
    setForm({
      division: division.division ?? "",
      main: division.main ?? "",
      powerball: Boolean(division.powerball),
      prize: division.prize ?? "",
      isActive: Boolean(division.isActive),
    });
    setShowForm(true);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this division?"
      )
    ) {
      return;
    }

    await dispatch(deleteDivision(id));
  };

  const handleToggle = async (id) => {
    await dispatch(toggleDivisionStatus(id));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Pakistan Powerball Divisions
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage Powerball division prize configuration.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => dispatch(getAllDivisions())}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={() => {
                if (showForm) {
                  resetForm();
                } else {
                  setShowForm(true);
                }
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {showForm ? (
                <X size={17} />
              ) : (
                <Plus size={17} />
              )}

              {showForm
                ? "Close"
                : "Add Division"}
            </button>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-gray-800">
              {editingId
                ? "Update Division"
                : "Create Division"}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Division
                </label>

                <input
                  type="number"
                  name="division"
                  min="1"
                  required
                  value={form.division}
                  onChange={handleChange}
                  placeholder="1"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Main
                </label>

                <input
                  type="number"
                  name="main"
                  min="0"
                  required
                  value={form.main}
                  onChange={handleChange}
                  placeholder="5"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Prize
                </label>

                <input
                  type="number"
                  name="prize"
                  min="0"
                  required
                  value={form.prize}
                  onChange={handleChange}
                  placeholder="100000"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  name="powerball"
                  checked={form.powerball}
                  onChange={handleChange}
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-gray-700">
                  Powerball
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3 py-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="h-4 w-4"
                />

                <span className="text-sm font-medium text-gray-700">
                  Active
                </span>
              </label>

              <div className="flex gap-2 md:col-span-2 lg:col-span-5">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading
                    ? "Saving..."
                    : editingId
                    ? "Update Division"
                    : "Create Division"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="font-semibold text-gray-800">
              All Divisions ({divisions.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Division
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Main
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Powerball
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Prize
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading && divisions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      Loading divisions...
                    </td>
                  </tr>
                ) : divisions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-5 py-10 text-center text-sm text-gray-500"
                    >
                      No divisions found.
                    </td>
                  </tr>
                ) : (
                  divisions.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-5 py-4 font-semibold text-gray-800">
                        Division {item.division}
                      </td>

                      <td className="px-5 py-4 text-gray-700">
                        {item.main}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.powerball
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.powerball
                            ? "Yes"
                            : "No"}
                        </span>
                      </td>

                      <td className="px-5 py-4 font-semibold text-gray-800">
                        {Number(item.prize).toLocaleString()}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggle(item._id)
                          }
                          disabled={loading}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.isActive
                            ? "Active"
                            : "Inactive"}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(item)
                            }
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                            title="Edit"
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleToggle(item._id)
                            }
                            className="rounded-lg bg-yellow-50 p-2 text-yellow-600 hover:bg-yellow-100"
                            title="Toggle"
                          >
                            <Power size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(item._id)
                            }
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PakistanPowerballDivisions;
