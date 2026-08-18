import { format } from "date-fns";
import { useEffect } from "react";
import { FaChevronLeft, FaChevronRight, FaTrophy } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPublicBidResults,
  selectPublicBidResults,
  setPage,
} from "../redux/slices/publicBidSlice";

const PublicBidResults = () => {
  const dispatch = useDispatch();
  const { results, pagination, loading, error, filters } = useSelector(
    selectPublicBidResults,
  );

  useEffect(() => {
    dispatch(fetchPublicBidResults(filters));
  }, [dispatch, filters, pagination.page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      dispatch(setPage(newPage));
    }
  };

  const getGameTypeColor = (gameType) => {
    const colors = {
      single: "bg-blue-100 text-blue-800",
      jodi: "bg-green-100 text-green-800",
      panna: "bg-purple-100 text-purple-800",
      "half-sangam": "bg-yellow-100 text-yellow-800",
      "full-sangam": "bg-red-100 text-red-800",
      "last-digit": "bg-indigo-100 text-indigo-800",
      "first-digit": "bg-pink-100 text-pink-800",
    };
    return colors[gameType] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status) => {
    const colors = {
      won: "bg-green-100 text-green-800",
      lost: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getGameTypeLabel = (type) => {
    const labels = {
      single: "Single",
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half Sangam",
      "full-sangam": "Full Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };
    return labels[type] || type;
  };

  if (loading && results.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="px-4 py-4">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FaTrophy className="text-yellow-500" />
            Matka Results
          </h2>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Game
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bid Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No results found
                    </td>
                  </tr>
                ) : (
                  results.map((bid) => (
                    <tr
                      key={bid._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-base font-bold text-gray-900">
                          {bid.number}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getGameTypeColor(bid.gameType)}`}
                        >
                          {getGameTypeLabel(bid.gameType)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        ₹{bid.bidAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-bold text-green-600">
                          ₹{bid.winAmount?.toLocaleString() || "0"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bid.status)}`}
                        >
                          {bid.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {format(new Date(bid.createdAt), "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs text-gray-400">
                          {format(new Date(bid.createdAt), "HH:mm")}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(
                  pagination.page * pagination.limit,
                  pagination.totalCount,
                )}{" "}
                of {pagination.totalCount} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="flex items-center gap-1 px-3 py-1 border rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  <FaChevronLeft className="text-xs" />
                  Previous
                </button>
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-1 px-3 py-1 border rounded-lg text-xs disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                >
                  Next
                  <FaChevronRight className="text-xs" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicBidResults;
