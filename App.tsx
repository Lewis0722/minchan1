import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Search, BookOpen, GraduationCap, AlertCircle, Loader2, Map, Check, ChevronDown, ChevronUp, Filter, ArrowUpDown, Info, Clock, X } from 'lucide-react';
import { UniversityData, RegionType, ScoreType, SearchOptions } from './types';
import { fetchUniversityData } from './services/geminiService';
import { UniversityCard } from './components/UniversityCard';

type SortOption = 'GPA_ASC' | 'CSAT_DESC' | 'NAME_ASC';

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UniversityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Search History State
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('uniPassSearchHistory');
        return saved ? JSON.parse(saved) : [];
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);

  // Search Options State (API params)
  const [selectedRegions, setSelectedRegions] = useState<RegionType[]>(['SEOUL', 'CAPITAL', 'OTHER']);
  const [scoreType, setScoreType] = useState<ScoreType>('NONE');
  const [scoreValue, setScoreValue] = useState('');
  const [showOptions, setShowOptions] = useState(true);

  // View Options State (Client-side filter/sort)
  const [viewRegion, setViewRegion] = useState<'ALL' | RegionType>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('GPA_ASC');

  // Helper to save history
  const saveToHistory = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== trimmed);
      const newHistory = [trimmed, ...filtered].slice(0, 5);
      localStorage.setItem('uniPassSearchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const deleteHistoryItem = (keyword: string) => {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== keyword);
      localStorage.setItem('uniPassSearchHistory', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Save history before searching
    saveToHistory(searchQuery);

    setLoading(true);
    setError(null);
    setResults([]);
    setHasSearched(true);
    
    // Automatically collapse options on search to show results
    setShowOptions(false);
    setShowHistory(false); // Hide history dropdown
    // Reset view filters
    setViewRegion('ALL');
    setSortBy('GPA_ASC');

    const options: SearchOptions = {
      regions: selectedRegions,
      scoreType,
      scoreValue
    };

    try {
      const data = await fetchUniversityData(searchQuery, options);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "검색 중 오류가 발생했습니다.");
      setShowOptions(true);
    } finally {
      setLoading(false);
    }
  }, [selectedRegions, scoreType, scoreValue]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleKeywordClick = (keyword: string) => {
    setQuery(keyword);
    performSearch(keyword);
  };

  const handleHistoryItemClick = (keyword: string) => {
    setQuery(keyword);
    performSearch(keyword);
  };

  const toggleRegion = (region: RegionType) => {
    setSelectedRegions(prev => 
      prev.includes(region) 
        ? prev.filter(r => r !== region)
        : [...prev, region]
    );
  };

  // Process results based on View Options
  const processedResults = useMemo(() => {
    let processed = [...results];

    // 1. Filter by Region (View tab)
    if (viewRegion !== 'ALL') {
      processed = processed.filter(uni => uni.regionCategory === viewRegion);
    }

    // 2. Sort
    processed.sort((a, b) => {
      // Use the latest available stats for sorting
      const aStats = a.stats.sort((x, y) => y.year - x.year)[0];
      const bStats = b.stats.sort((x, y) => y.year - x.year)[0];

      switch (sortBy) {
        case 'GPA_ASC': // 내신 높은순 (낮은 등급 우선)
          return (aStats?.cutoffGPA || 9) - (bStats?.cutoffGPA || 9);
        case 'CSAT_DESC': // 수능 높은순 (높은 백분위 우선)
          return (bStats?.cutoffCSAT || 0) - (aStats?.cutoffCSAT || 0);
        case 'NAME_ASC': // 가나다순
          return a.universityName.localeCompare(b.universityName);
        default:
          return 0;
      }
    });

    return processed;
  }, [results, viewRegion, sortBy]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { 
            setQuery(''); 
            setHasSearched(false); 
            setResults([]); 
            setShowOptions(true);
          }}>
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              UniPass 2026
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        
        {/* Search Section */}
        <div className={`transition-all duration-500 ${hasSearched ? 'mb-8' : 'mb-20 mt-10 text-center'}`}>
          {!hasSearched && (
             <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
               나에게 맞는 <span className="text-indigo-600">대학</span>을 찾아보세요
             </h1>
          )}
          
          <div className={`relative max-w-2xl mx-auto ${hasSearched ? '' : ''}`}>
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative z-20">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowHistory(true)}
                onBlur={() => setShowHistory(false)}
                placeholder="희망 학과를 입력하세요 (예: 컴퓨터공학과)"
                className={`w-full bg-white border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-t-2xl ${(showOptions || (showHistory && searchHistory.length > 0)) ? 'rounded-b-none border-b-0' : 'rounded-b-2xl'} py-4 pl-6 pr-14 text-lg outline-none transition-all placeholder:text-slate-400 shadow-sm`}
                disabled={loading}
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full transition-colors disabled:bg-indigo-400"
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <Search size={24} />}
              </button>
            </form>

            {/* Search History Dropdown */}
            {showHistory && searchHistory.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border-2 border-slate-200 border-t-0 rounded-b-2xl shadow-xl z-30 overflow-hidden mt-[-2px]">
                {searchHistory.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
                      onClick={() => handleHistoryItemClick(item)}
                    >
                      <div className="flex items-center gap-3 text-slate-600">
                          <Clock size={16} className="text-slate-400" />
                          <span className="text-sm font-medium">{item}</span>
                      </div>
                      <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHistoryItem(item);
                          }}
                          className="text-slate-300 hover:text-red-500 p-1"
                          title="삭제"
                      >
                          <X size={16} />
                      </button>
                    </div>
                ))}
              </div>
            )}

            {/* Filter Options Panel (Pre-search) */}
            <div className={`bg-white border-2 border-slate-200 border-t-0 rounded-b-2xl overflow-hidden transition-all duration-300 ${(showOptions && !(showHistory && searchHistory.length > 0)) ? 'opacity-100 max-h-[500px] shadow-lg p-6 pt-2' : 'max-h-0 opacity-0 p-0 border-0'}`}>
              <div className="space-y-6 text-left">
                
                {/* Region Selection */}
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                    <Map size={16} /> 희망 지역 검색 (API 요청)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'SEOUL', label: '서울' },
                      { id: 'CAPITAL', label: '수도권' },
                      { id: 'OTHER', label: '지방' }
                    ].map((region) => (
                      <button
                        key={region.id}
                        type="button"
                        onClick={() => toggleRegion(region.id as RegionType)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedRegions.includes(region.id as RegionType)
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border'
                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                         {selectedRegions.includes(region.id as RegionType) && <Check size={14} strokeWidth={3} />}
                         {region.label}
                      </button>
                    ))}
                  </div>
                  {selectedRegions.length === 0 && (
                     <p className="text-xs text-red-500 mt-1">최소 하나의 지역을 선택해주세요.</p>
                  )}
                </div>

                {/* Score Input */}
                <div>
                  <label className="text-sm font-bold text-slate-700 mb-2 block flex items-center gap-2">
                    <BookOpen size={16} /> 검색 성적 (선택)
                  </label>
                  <div className="flex flex-col sm:flex-row gap-4">
                     <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => { setScoreType('NONE'); setScoreValue(''); }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border ${scoreType === 'NONE' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          입력 안함
                        </button>
                        <button
                          type="button"
                          onClick={() => setScoreType('GPA')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border ${scoreType === 'GPA' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          내신 입력
                        </button>
                        <button
                          type="button"
                          onClick={() => setScoreType('CSAT')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium border ${scoreType === 'CSAT' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200'}`}
                        >
                          수능 입력
                        </button>
                     </div>
                     
                     {scoreType !== 'NONE' && (
                       <div className="flex-1 animate-fadeIn">
                         <div className="relative">
                            <input 
                              type="number" 
                              value={scoreValue}
                              onChange={(e) => setScoreValue(e.target.value)}
                              placeholder={scoreType === 'GPA' ? "등급 입력 (예: 2.5)" : "백분위 입력 (예: 92)"}
                              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              step={scoreType === 'GPA' ? "0.1" : "1"}
                            />
                            <span className="absolute right-3 top-2 text-sm text-slate-400">
                              {scoreType === 'GPA' ? '등급' : '%'}
                            </span>
                         </div>
                         <p className="text-xs text-slate-500 mt-1">
                           * 입력한 점수로 <strong>지원 가능한(적정/안정)</strong> 대학을 중심으로 검색합니다. (입력값 이하 검색)
                         </p>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Toggle Button for Options (only visible when searched) */}
            {hasSearched && !loading && (
              <div className="flex justify-center mt-[-2px] relative z-10">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="bg-white border border-t-0 border-slate-200 text-slate-500 text-xs px-4 py-1 rounded-b-lg shadow-sm hover:text-indigo-600 flex items-center gap-1"
                >
                  {showOptions ? (
                    <>검색 조건 접기 <ChevronUp size={12} /></>
                  ) : (
                    <>검색 조건 수정 <Filter size={10} /> <ChevronDown size={12} /></>
                  )}
                </button>
              </div>
            )}

          </div>
          
          {!hasSearched && (
            <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm text-slate-500">
              <span>추천 검색어:</span>
              {['컴퓨터공학과', '의예과', '경영학과', '심리학과', '간호학과'].map(word => (
                <button 
                  key={word} 
                  onClick={() => handleKeywordClick(word)}
                  className="bg-white border border-slate-200 px-3 py-1 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {word}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Section */}
        {error && (
          <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700 animate-fadeIn">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold">오류가 발생했습니다</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {loading && !results.length && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div className="inline-block relative">
               <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-75"></div>
               <div className="relative bg-white p-4 rounded-full shadow-lg">
                 <Loader2 className="animate-spin text-indigo-600" size={40} />
               </div>
            </div>
            <p className="mt-6 text-lg font-medium text-slate-600 animate-pulse">
              맞춤형 입시 데이터를 분석 중입니다...
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {scoreType !== 'NONE' && scoreValue 
                ? `${scoreType === 'GPA' ? `내신 ${scoreValue}등급` : `수능 ${scoreValue}%`} 기준 ` 
                : ''}
              지원 가능한(적정/안정) 대학을 찾고 있습니다.
            </p>
          </div>
        )}

        {hasSearched && !loading && results.length === 0 && !error && (
          <div className="text-center py-20 text-slate-500">
            <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg">검색 결과가 없습니다.</p>
            <p className="text-sm">검색 조건을 변경하여 다시 시도해보세요.</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="animate-fadeInUp">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  '<span className="text-indigo-600">{query}</span>' 분석 결과
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {processedResults.length}개
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                   * 캠퍼스(분교)는 별도의 대학으로 분류하여 표시됩니다.
                </p>
              </div>

              {/* View Options (Filter & Sort) */}
              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                {/* Region Filter Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-lg overflow-x-auto no-scrollbar">
                  {[
                    { id: 'ALL', label: '전체' },
                    { id: 'SEOUL', label: '서울' },
                    { id: 'CAPITAL', label: '수도권' },
                    { id: 'OTHER', label: '지방' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setViewRegion(tab.id as any)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
                        viewRegion === tab.id
                          ? 'bg-white text-indigo-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="relative shrink-0">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ArrowUpDown size={14} />
                  </div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full sm:w-auto pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer hover:bg-slate-50"
                  >
                    <option value="GPA_ASC">내신 높은순 (1등급↑)</option>
                    <option value="CSAT_DESC">수능 높은순 (백분위↑)</option>
                    <option value="NAME_ASC">대학명 가나다순</option>
                  </select>
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {processedResults.map((uni) => (
                <UniversityCard key={uni.id} data={uni} />
              ))}
            </div>
            
            <div className="mt-8 mb-4 p-4 bg-slate-100 rounded-lg border border-slate-200 flex items-start gap-3">
               <Info className="text-slate-500 shrink-0 mt-0.5" size={18} />
               <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-700">데이터 안내</p>
                  <p>본 서비스에서 제공하는 입시 결과는 AI가 주요 입시 포털(Adiga 등)의 데이터를 기반으로 추정한 값입니다. 매 검색 시 결과가 소폭 변동될 수 있습니다.</p>
                  <p>모든 점수는 <span className="font-bold">최종 등록자 기준 상위 70% 컷</span>을 의미합니다. (평균값이 아님)</p>
                  <p>정확한 입시 전략 수립을 위해서는 각 대학 입학처의 공식 모집요강을 반드시 확인하시기 바랍니다.</p>
               </div>
            </div>

            {processedResults.length === 0 && (
               <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                 <Map size={32} className="mx-auto text-slate-300 mb-2" />
                 <p className="text-slate-500 font-medium">선택한 지역의 검색 결과가 없습니다.</p>
                 <button 
                   onClick={() => setViewRegion('ALL')}
                   className="mt-2 text-sm text-indigo-600 hover:underline"
                 >
                   전체 지역 보기
                 </button>
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;