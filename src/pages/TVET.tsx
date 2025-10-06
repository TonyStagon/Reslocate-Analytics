import React, { useState, useEffect, useMemo } from "react";
import { SearchableTable } from "../components/SearchableTable";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { supabase } from "../lib/supabase";
import { ChevronDown } from "lucide-react";

interface TVETCollege {
  qualification: string;
  aps: number;
  faculty: string;
  tvet_college_name: string;
  id: number;
}

export function TVET() {
  const [colleges, setColleges] = useState<TVETCollege[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<string>("all");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [selectedAPS, setSelectedAPS] = useState<string>("all");

  const fetchTVETColleges = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("tvet_colleges_name")
        .select("qualification, aps, faculty, tvet_college_name, id")
        .not("qualification", "is", null)
        .order("tvet_college_name")
        .order("faculty")
        .order("qualification");

      if (error) throw error;
      setColleges(data || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch TVET colleges"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTVETColleges();
  }, []);

  const uniqueColleges = useMemo(() => {
    const names = Array.from(new Set(colleges.map((c) => c.tvet_college_name)));
    return names.sort();
  }, [colleges]);

  const uniqueFaculties = useMemo(() => {
    const filtered =
      selectedCollege === "all"
        ? colleges
        : colleges.filter((c) => c.tvet_college_name === selectedCollege);
    const faculties = Array.from(new Set(filtered.map((c) => c.faculty)));
    return faculties.sort();
  }, [colleges, selectedCollege]);

  const apsRanges = [
    { label: "All APS", value: "all" },
    { label: "0-15", value: "0-15" },
    { label: "16-20", value: "16-20" },
    { label: "21-25", value: "21-25" },
    { label: "26+", value: "26+" },
  ];

  const filteredColleges = useMemo(() => {
    return colleges.filter((college) => {
      if (
        selectedCollege !== "all" &&
        college.tvet_college_name !== selectedCollege
      )
        return false;
      if (selectedFaculty !== "all" && college.faculty !== selectedFaculty)
        return false;
      if (selectedAPS !== "all") {
        const aps = college.aps;
        switch (selectedAPS) {
          case "0-15":
            return aps <= 15;
          case "16-20":
            return aps >= 16 && aps <= 20;
          case "21-25":
            return aps >= 21 && aps <= 25;
          case "26+":
            return aps >= 26;
          default:
            return true;
        }
      }
      return true;
    });
  }, [colleges, selectedCollege, selectedFaculty, selectedAPS]);

  const columns = [
    { key: "tvet_college_name", label: "TVET College" },
    { key: "faculty", label: "Faculty" },
    { key: "qualification", label: "Qualification" },
    {
      key: "aps",
      label: "APS Required",
      render: (value: number) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value >= 25
              ? "bg-red-100 text-red-800"
              : value >= 20
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {value || "N/A"}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error)
    return <ErrorMessage message={error} onRetry={fetchTVETColleges} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          TVET College Programs
        </h1>
        <p className="text-gray-600">
          Explore technical and vocational education opportunities
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Filter Programs
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              TVET College
            </label>
            <div className="relative">
              <select
                value={selectedCollege}
                onChange={(e) => {
                  setSelectedCollege(e.target.value);
                  setSelectedFaculty("all");
                }}
                className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All TVET Colleges</option>
                {uniqueColleges.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Faculty
            </label>
            <div className="relative">
              <select
                value={selectedFaculty}
                onChange={(e) => setSelectedFaculty(e.target.value)}
                className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="all">All Faculties</option>
                {uniqueFaculties.map((faculty) => (
                  <option key={faculty} value={faculty}>
                    {faculty}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              APS Range
            </label>
            <div className="relative">
              <select
                value={selectedAPS}
                onChange={(e) => setSelectedAPS(e.target.value)}
                className="w-full appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {apsRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {(selectedCollege !== "all" ||
          selectedFaculty !== "all" ||
          selectedAPS !== "all") && (
          <button
            onClick={() => {
              setSelectedCollege("all");
              setSelectedFaculty("all");
              setSelectedAPS("all");
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredColleges.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">{colleges.length}</span>{" "}
          programs
        </p>
      </div>

      <SearchableTable
        data={filteredColleges}
        columns={columns}
        searchPlaceholder="Search qualifications..."
        exportFilename="tvet_colleges"
      />
    </div>
  );
}
