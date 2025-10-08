'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';

export default function AiManagerPage() {
  const [scrapedData, setScrapedData] = useState([]);
  const [dbScrapedData, setDbScrapedData] = useState([]);
  const [selectedDbItems, setSelectedDbItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scrape');
  const [selectedSite, setSelectedSite] = useState('visitSeoul');
  
  // 사이트 설정
  const [siteConfigs, setSiteConfigs] = useState({
    visitSeoul: {
      month: '202508',
      maxResults: 10,
      autoPublish: false
    },
    culturePortal: {
      category: 'exhibition',
      maxResults: 10,
      autoPublish: false
    },
    artCenter: {
      maxResults: 10,
      autoPublish: false
    }
  });

  // 사이트 정보
  const sites = [
    {
      key: 'visitSeoul',
      name: 'Visit Seoul',
      description: '서울 관광 공식 사이트의 전시 정보',
      icon: 'lucide:building',
      color: 'blue',
      url: 'https://korean.visitseoul.net/exhibition'
    },
    {
      key: 'culturePortal',
      name: '문화포털',
      description: '문화체육관광부 문화포털의 전시 정보',
      icon: 'lucide:landmark',
      color: 'purple',
      url: 'https://www.culture.go.kr'
    },
    {
      key: 'artCenter',
      name: '예술의전당',
      description: '예술의전당 공식 사이트의 전시 정보',
      icon: 'lucide:palette',
      color: 'green',
      url: 'https://www.sac.or.kr'
    }
  ];

  const currentSite = sites.find(site => site.key === selectedSite);
  const currentConfig = siteConfigs[selectedSite];

  // 토스트 메시지 함수
  const addToast = ({ title, description, color }) => {
    // 간단한 alert로 대체 (실제로는 toast 라이브러리 사용)
    alert(`${title}: ${description}`);
  };

  // 스크랩된 데이터 발행
  const publishScrapedData = async () => {
    if (scrapedData.length === 0) {
      addToast({
        title: '발행할 데이터가 없습니다',
        color: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/publish-scraped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: scrapedData,
          source: selectedSite,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '발행 중 오류가 발생했습니다.');
      }

      addToast({
        title: '발행 완료',
        description: '스크랩된 데이터가 성공적으로 발행되었습니다.',
        color: 'success',
      });

      setScrapedData([]); // 발행 후 데이터 초기화
      await loadDbScrapedData(); // DB 데이터 새로고침
    } catch (error) {
      console.error('발행 오류:', error);
      addToast({
        title: '발행 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // 스크랩 결과 초기화
  const clearScrapedData = () => {
    if (scrapedData.length === 0) {
      addToast({
        title: '삭제할 데이터가 없습니다',
        color: 'warning',
      });
      return;
    }

    if (confirm(`정말로 ${scrapedData.length}개의 스크랩 결과를 모두 삭제하시겠습니까?`)) {
      setScrapedData([]);
      addToast({
        title: '초기화 완료',
        description: '모든 스크랩 결과가 삭제되었습니다.',
        color: 'success',
      });
    }
  };

  // 선택된 사이트에 따른 스크랩 실행
  const runScrape = async () => {
    switch (selectedSite) {
      case 'visitSeoul':
        await scrapeVisitSeoul();
        break;
      case 'culturePortal':
        await scrapeCulturePortal();
        break;
      case 'artCenter':
        await scrapeArtCenter();
        break;
      default:
        addToast({
          title: '오류',
          description: '선택된 사이트를 찾을 수 없습니다.',
          color: 'danger',
        });
    }
  };

  // Visit Seoul 스크래핑
  const scrapeVisitSeoul = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/scrape-visitseoul', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: siteConfigs.visitSeoul.month,
          maxResults: siteConfigs.visitSeoul.maxResults,
          autoPublish: siteConfigs.visitSeoul.autoPublish,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Visit Seoul 스크랩 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
      // 기존 데이터에 새 데이터 추가 (누적)
      setScrapedData(prevData => [...prevData, ...(result.data || [])]);

      addToast({
        title: 'Visit Seoul 스크랩 완료',
        description: `${result.data?.length || 0}개의 전시 정보를 수집했습니다. (총 ${scrapedData.length + (result.data?.length || 0)}개)`,
        color: 'success',
      });
    } catch (error) {
      console.error('Visit Seoul 스크랩 오류:', error);
      addToast({
        title: '스크랩 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // 문화포털 스크래핑
  const scrapeCulturePortal = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/scrape-cultureportal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: siteConfigs.culturePortal.category,
          maxResults: siteConfigs.culturePortal.maxResults,
          autoPublish: siteConfigs.culturePortal.autoPublish,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '문화포털 스크랩 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
      // 기존 데이터에 새 데이터 추가 (누적)
      setScrapedData(prevData => [...prevData, ...(result.data || [])]);

      addToast({
        title: '문화포털 스크랩 완료',
        description: `${result.data?.length || 0}개의 전시 정보를 수집했습니다. (총 ${scrapedData.length + (result.data?.length || 0)}개)`,
        color: 'success',
      });
    } catch (error) {
      console.error('문화포털 스크랩 오류:', error);
      addToast({
        title: '스크랩 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // 예술의전당 스크래핑
  const scrapeArtCenter = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/scrape-artcenter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxResults: siteConfigs.artCenter.maxResults,
          autoPublish: siteConfigs.artCenter.autoPublish,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '예술의전당 스크랩 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
      // 기존 데이터에 새 데이터 추가 (누적)
      setScrapedData(prevData => [...prevData, ...(result.data || [])]);

      addToast({
        title: '예술의전당 스크랩 완료',
        description: `${result.data?.length || 0}개의 전시 정보를 수집했습니다. (총 ${scrapedData.length + (result.data?.length || 0)}개)`,
        color: 'success',
      });
    } catch (error) {
      console.error('예술의전당 스크랩 오류:', error);
      addToast({
        title: '스크랩 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  // DB에서 스크랩된 데이터 조회
  const loadDbScrapedData = async () => {
    try {
      setDbLoading(true);
      
      const response = await fetch('/api/scraped-data');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'DB 데이터 조회 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      setDbScrapedData(result.data || []);
      
      addToast({
        title: 'DB 데이터 로드 완료',
        description: `${result.data?.length || 0}개의 스크랩 데이터를 불러왔습니다.`,
        color: 'success',
      });
    } catch (error) {
      console.error('DB 데이터 조회 오류:', error);
      addToast({
        title: 'DB 데이터 조회 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setDbLoading(false);
    }
  };

  // 선택된 DB 항목 삭제
  const deleteSelectedDbItems = async () => {
    if (selectedDbItems.length === 0) {
      addToast({
        title: '삭제할 항목을 선택해주세요',
        color: 'warning',
      });
      return;
    }

    if (!confirm(`정말로 ${selectedDbItems.length}개의 스크랩 데이터를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDbLoading(true);
      
      const response = await fetch('/api/scraped-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedDbItems }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '삭제 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
      addToast({
        title: '삭제 완료',
        description: result.message,
        color: 'success',
      });

      setSelectedDbItems([]);
      await loadDbScrapedData(); // 목록 새로고침
    } catch (error) {
      console.error('DB 데이터 삭제 오류:', error);
      addToast({
        title: '삭제 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setDbLoading(false);
    }
  };

  // 선택된 DB 항목 발행
  const publishSelectedDbItems = async () => {
    if (selectedDbItems.length === 0) {
      addToast({
        title: '발행할 항목을 선택해주세요',
        color: 'warning',
      });
      return;
    }

    if (!confirm(`선택된 ${selectedDbItems.length}개의 스크랩 데이터를 community에 발행하고 DB에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDbLoading(true);
      
      // 선택된 항목들 가져오기
      const selectedData = dbScrapedData.filter(item => selectedDbItems.includes(item.id));
      
      // community에 발행
      const publishResponse = await fetch('/api/publish-to-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: selectedData,
          deleteFromScraped: true 
        }),
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        throw new Error(errorData.error || '발행 중 오류가 발생했습니다.');
      }

      const result = await publishResponse.json();
      
      addToast({
        title: '발행 완료',
        description: `${result.published}개의 포스트가 community에 발행되었습니다.`,
        color: 'success',
      });

      setSelectedDbItems([]);
      await loadDbScrapedData(); // 목록 새로고침
    } catch (error) {
      console.error('DB 데이터 발행 오류:', error);
      addToast({
        title: '발행 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setDbLoading(false);
    }
  };

  // 전체 DB 스크랩 데이터 발행
  const publishAllDbScrapedData = async () => {
    if (dbScrapedData.length === 0) {
      addToast({
        title: '발행할 데이터가 없습니다',
        color: 'warning',
      });
      return;
    }

    if (!confirm(`모든 스크랩 데이터(${dbScrapedData.length}개)를 community에 발행하고 DB에서 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDbLoading(true);
      
      // community에 발행
      const publishResponse = await fetch('/api/publish-to-community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: dbScrapedData,
          deleteFromScraped: true 
        }),
      });

      if (!publishResponse.ok) {
        const errorData = await publishResponse.json();
        throw new Error(errorData.error || '전체 발행 중 오류가 발생했습니다.');
      }

      const result = await publishResponse.json();
      
      addToast({
        title: '전체 발행 완료',
        description: `${result.published}개의 포스트가 community에 발행되었습니다.`,
        color: 'success',
      });

      setSelectedDbItems([]);
      setDbScrapedData([]);
    } catch (error) {
      console.error('전체 DB 데이터 발행 오류:', error);
      addToast({
        title: '전체 발행 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setDbLoading(false);
    }
  };

  // 전체 DB 스크랩 데이터 삭제
  const deleteAllDbScrapedData = async () => {
    if (dbScrapedData.length === 0) {
      addToast({
        title: '삭제할 데이터가 없습니다',
        color: 'warning',
      });
      return;
    }

    if (!confirm(`정말로 모든 스크랩 데이터(${dbScrapedData.length}개)를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      setDbLoading(true);
      
      const allIds = dbScrapedData.map(item => item.id);
      
      const response = await fetch('/api/scraped-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: allIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '전체 삭제 중 오류가 발생했습니다.');
      }

      const result = await response.json();
      
      addToast({
        title: '전체 삭제 완료',
        description: result.message,
        color: 'success',
      });

      setSelectedDbItems([]);
      setDbScrapedData([]);
    } catch (error) {
      console.error('전체 DB 데이터 삭제 오류:', error);
      addToast({
        title: '전체 삭제 실패',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setDbLoading(false);
    }
  };

  // 컴포넌트 마운트 시 DB 데이터 로드
  useEffect(() => {
    loadDbScrapedData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">사이트별 콘텐츠 스크랩</h1>
          <p className="text-gray-600 mt-2">각 사이트의 특성에 맞는 정확한 정보를 수집합니다</p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="w-full">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab('scrape')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'scrape'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              스크랩하기
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              데이터 관리
            </button>
          </div>
          
          {activeTab === 'scrape' && (
            <div className="space-y-6">
              {/* 사이트 선택 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sites.map((site) => (
                  <div
                    key={site.key}
                    onClick={() => setSelectedSite(site.key)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSite === site.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <h3 className="text-lg font-semibold">{site.name}</h3>
                      <p className="text-sm text-gray-600">{site.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 선택된 사이트 설정 */}
              {currentSite && (
                <div className="bg-white border rounded-lg p-6">
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold">{currentSite.name} 설정</h3>
                  </div>
                  <div className="space-y-4">
                    {/* Visit Seoul 설정 */}
                    {selectedSite === 'visitSeoul' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="조회 월"
                          placeholder="202508"
                          value={currentConfig.month}
                          onChange={(e) => setSiteConfigs({
                            ...siteConfigs,
                            visitSeoul: { ...currentConfig, month: e.target.value }
                          })}
                          description="YYYYMM 형식 (예: 202508)"
                        />
                        <Input
                          label="최대 결과 수"
                          type="number"
                          min="1"
                          max="50"
                          value={currentConfig.maxResults}
                          onChange={(e) => setSiteConfigs({
                            ...siteConfigs,
                            visitSeoul: { ...currentConfig, maxResults: parseInt(e.target.value) || 10 }
                          })}
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={currentConfig.autoPublish}
                            onValueChange={(value) => setSiteConfigs({
                              ...siteConfigs,
                              visitSeoul: { ...currentConfig, autoPublish: value }
                            })}
                          />
                          <span className="text-sm">자동 발행</span>
                        </div>
                      </div>
                    )}

                    {/* 문화포털 설정 */}
                    {selectedSite === 'culturePortal' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select
                          label="카테고리"
                          selectedKeys={[currentConfig.category]}
                          onSelectionChange={(keys) => setSiteConfigs({
                            ...siteConfigs,
                            culturePortal: { ...currentConfig, category: Array.from(keys)[0] }
                          })}
                        >
                          <SelectItem key="exhibition" value="exhibition">전시</SelectItem>
                          <SelectItem key="performance" value="performance">공연</SelectItem>
                          <SelectItem key="festival" value="festival">축제</SelectItem>
                        </Select>
                        <Input
                          label="최대 결과 수"
                          type="number"
                          min="1"
                          max="50"
                          value={currentConfig.maxResults}
                          onChange={(e) => setSiteConfigs({
                            ...siteConfigs,
                            culturePortal: { ...currentConfig, maxResults: parseInt(e.target.value) || 10 }
                          })}
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={currentConfig.autoPublish}
                            onValueChange={(value) => setSiteConfigs({
                              ...siteConfigs,
                              culturePortal: { ...currentConfig, autoPublish: value }
                            })}
                          />
                          <span className="text-sm">자동 발행</span>
                        </div>
                      </div>
                    )}

                    {/* 예술의전당 설정 */}
                    {selectedSite === 'artCenter' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          label="최대 결과 수"
                          type="number"
                          min="1"
                          max="50"
                          value={currentConfig.maxResults}
                          onChange={(e) => setSiteConfigs({
                            ...siteConfigs,
                            artCenter: { ...currentConfig, maxResults: parseInt(e.target.value) || 10 }
                          })}
                        />
                        <div className="flex items-center gap-2">
                          <Switch
                            isSelected={currentConfig.autoPublish}
                            onValueChange={(value) => setSiteConfigs({
                              ...siteConfigs,
                              artCenter: { ...currentConfig, autoPublish: value }
                            })}
                          />
                          <span className="text-sm">자동 발행</span>
                        </div>
                      </div>
                    )}
                  </CardBody>
                  <CardFooter>
                    <Button
                      color="primary"
                      onPress={runScrape}
                      isLoading={loading}
                      startContent={<Icon icon="lucide:download" />}
                    >
                      스크랩 실행
                    </Button>
                  </CardFooter>
                </Card>
              )}

              {/* 스크랩 결과 */}
              <Card className="p-6">
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">스크랩 결과 ({scrapedData.length}개)</h3>
                  <div className="flex gap-2">
                    <Button
                      color="success"
                      onPress={publishScrapedData}
                      isLoading={loading}
                      isDisabled={scrapedData.length === 0}
                      startContent={<Icon icon="lucide:send" />}
                    >
                      발행하기
                    </Button>
                    <Button
                      variant="light"
                      onPress={clearScrapedData}
                      isLoading={loading}
                      startContent={<Icon icon="lucide:trash" />}
                    >
                      전체 삭제
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  {scrapedData.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">스크랩된 데이터가 없습니다.</p>
                  ) : (
                    <Table aria-label="스크랩 결과">
                      <TableHeader>
                        <TableColumn>제목</TableColumn>
                        <TableColumn>기간</TableColumn>
                        <TableColumn>장소</TableColumn>
                        <TableColumn>출처</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {scrapedData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.location}</TableCell>
                            <TableCell>{item.source}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>

          <Tab key="database" title="DB 관리">
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">DB 스크랩 데이터 ({dbScrapedData.length}개)</h3>
                  <div className="flex gap-2">
                    <Button
                      color="success"
                      onPress={publishSelectedDbItems}
                      isLoading={dbLoading}
                      isDisabled={selectedDbItems.length === 0}
                      startContent={<Icon icon="lucide:send" />}
                    >
                      선택 발행 ({selectedDbItems.length})
                    </Button>
                    <Button
                      color="success"
                      variant="flat"
                      onPress={publishAllDbScrapedData}
                      isLoading={dbLoading}
                      isDisabled={dbScrapedData.length === 0}
                      startContent={<Icon icon="lucide:send" />}
                    >
                      전체 발행
                    </Button>
                    <Button
                      variant="light"
                      onPress={loadDbScrapedData}
                      isLoading={dbLoading}
                      startContent={<Icon icon="lucide:refresh-cw" />}
                    >
                      새로고침
                    </Button>
                    <Button
                      color="danger"
                      onPress={deleteSelectedDbItems}
                      isLoading={dbLoading}
                      isDisabled={selectedDbItems.length === 0}
                      startContent={<Icon icon="lucide:trash" />}
                    >
                      선택 삭제 ({selectedDbItems.length})
                    </Button>
                    <Button
                      color="danger"
                      variant="flat"
                      onPress={deleteAllDbScrapedData}
                      isLoading={dbLoading}
                      isDisabled={dbScrapedData.length === 0}
                      startContent={<Icon icon="lucide:trash-2" />}
                    >
                      전체 삭제
                    </Button>
                  </div>
                </CardHeader>
                <CardBody>
                  {dbScrapedData.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">DB에 저장된 스크랩 데이터가 없습니다.</p>
                  ) : (
                    <Table 
                      aria-label="DB 스크랩 데이터"
                      selectionMode="multiple"
                      selectedKeys={selectedDbItems}
                      onSelectionChange={setSelectedDbItems}
                    >
                      <TableHeader>
                        <TableColumn>선택</TableColumn>
                        <TableColumn>제목</TableColumn>
                        <TableColumn>내용</TableColumn>
                        <TableColumn>출처</TableColumn>
                        <TableColumn>생성일</TableColumn>
                      </TableHeader>
                      <TableBody>
                        {dbScrapedData.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                isSelected={selectedDbItems.includes(item.id)}
                                onValueChange={(isSelected) => {
                                  if (isSelected) {
                                    setSelectedDbItems([...selectedDbItems, item.id]);
                                  } else {
                                    setSelectedDbItems(selectedDbItems.filter(id => id !== item.id));
                                  }
                                }}
                              />
                            </TableCell>
                            <TableCell>{item.title}</TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">
                                {item.summary?.substring(0, 100) || '내용 없음'}...
                              </div>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                color={item.source === 'visitSeoul' ? 'primary' : 
                                       item.source === 'culturePortal' ? 'secondary' : 'default'}
                                variant="flat"
                              >
                                {item.source || 'unknown'}
                              </Chip>
                            </TableCell>
                            <TableCell>
                              {new Date(item.created_at).toLocaleDateString('ko-KR')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardBody>
              </Card>
            </div>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
} 