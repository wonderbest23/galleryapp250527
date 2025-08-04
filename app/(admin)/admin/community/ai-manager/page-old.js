'use client';
import { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Switch,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Spinner,
  Chip,
  Divider,
  Select,
  SelectItem,
  addToast,
} from '@heroui/react';
import { createClient } from '@/utils/supabase/client';
import { Icon } from '@iconify/react';

export default function AiManagerPage() {
  const supabase = createClient();
  const [scrapedData, setScrapedData] = useState([]);
  const [dbScrapedData, setDbScrapedData] = useState([]);
  const [selectedDbItems, setSelectedDbItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('scrape');
  const [selectedSite, setSelectedSite] = useState('visitSeoul');
  
  // 사이트별 설정
  const [siteConfigs, setSiteConfigs] = useState({
    visitSeoul: {
      month: '202508', // YYYYMM 형식
      maxResults: 10,
      autoPublish: false,
    },
    culturePortal: {
      category: 'exhibition',
      maxResults: 10,
      autoPublish: false,
    },
    artCenter: {
      maxResults: 10,
      autoPublish: false,
    }
  });

  // 사이트 정보
  const sites = [
    {
      key: 'visitSeoul',
      name: 'Visit Seoul 전시',
      description: '서울시 공식 관광사이트의 전시 정보',
      url: 'https://korean.visitseoul.net/exhibition',
      icon: 'lucide:building',
      color: 'primary'
    },
    {
      key: 'culturePortal',
      name: '문화포털',
      description: '문화체육관광부 문화포털의 전시 정보',
      url: 'https://www.culture.go.kr',
      icon: 'lucide:landmark',
      color: 'secondary'
    },
    {
      key: 'artCenter',
      name: '예술의전당',
      description: '예술의전당 전시 정보',
      url: 'https://www.sac.or.kr',
      icon: 'lucide:palette',
      color: 'success'
    }
  ];

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

  // 현재 선택된 사이트 정보
  const currentSite = sites.find(site => site.key === selectedSite);
  const currentConfig = siteConfigs[selectedSite];

  return (
    <div className="w-full h-full flex flex-col gap-6 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">사이트별 콘텐츠 스크랩</h1>
          <p className="text-gray-600 mt-2">각 사이트의 특성에 맞는 정확한 정보를 수집합니다</p>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs 
          selectedKey={activeTab} 
          onSelectionChange={setActiveTab}
          className="w-full"
        >
          <Tab key="scrape" title="스크랩하기">
            <div className="space-y-6">
              {/* 사이트 선택 카드들 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sites.map((site) => (
                  <Card
                    key={site.key}
                    className={`cursor-pointer transition-all ${
                      selectedSite === site.key
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onPress={() => setSelectedSite(site.key)}
                  >
                    <CardBody className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-${site.color}-100`}>
                          <Icon icon={site.icon} className={`text-${site.color}-600 text-xl`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{site.name}</h3>
                          <p className="text-sm text-gray-600">{site.description}</p>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>

        {/* 선택된 사이트 설정 */}
        {currentSite && (
          <Card className={`border-${currentSite.color}-200`}>
            <CardHeader>
              <h2 className={`text-xl font-semibold text-${currentSite.color}-900 flex items-center gap-2`}>
                <Icon icon={currentSite.icon} className={`text-${currentSite.color}-600`} />
                {currentSite.name} 설정
              </h2>
              <p className="text-sm text-gray-600">{currentSite.url}</p>
            </CardHeader>
            <CardBody>
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
                    size="sm"
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
                    size="sm"
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
                    value={currentConfig.category}
                    onChange={(e) => setSiteConfigs({
                      ...siteConfigs,
                      culturePortal: { ...currentConfig, category: e.target.value }
                    })}
                    size="sm"
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
                    size="sm"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    size="sm"
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

              <div className="mt-4">
                <Button
                  color={currentSite.color}
                  onPress={runScrape}
                  isLoading={loading}
                  startContent={<Icon icon="lucide:download" />}
                  className="w-full md:w-auto"
                >
                  {currentSite.name} 스크랩 실행
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* 스크랩 결과 */}
        {scrapedData.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">스크랩 결과 ({scrapedData.length}개)</h2>
                <div className="flex gap-2">
                  <Button
                    color="warning"
                    variant="flat"
                    onPress={publishScrapedData}
                    isLoading={loading}
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
              </div>
            </CardHeader>
            <CardBody>
              <Table aria-label="스크랩 결과 테이블">
                <TableHeader>
                  <TableColumn>제목</TableColumn>
                  <TableColumn>기간</TableColumn>
                  <TableColumn>장소</TableColumn>
                  <TableColumn>URL</TableColumn>
                  <TableColumn>수집 시간</TableColumn>
                </TableHeader>
                <TableBody>
                  {scrapedData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="font-medium">{item.title || '제목 없음'}</div>
                        {item.description && (
                          <div className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {item.startDate && item.endDate 
                            ? `${item.startDate} ~ ${item.endDate}`
                            : item.date || '기간 정보 없음'
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {item.location || item.venue || '장소 정보 없음'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.url && (
                          <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            링크
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date().toLocaleString('ko-KR')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* 도움말 */}
        <Card className="bg-gray-50">
          <CardHeader>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Icon icon="lucide:help-circle" />
              사이트별 스크래퍼 특징
            </h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Icon icon="lucide:building" className="text-blue-600" />
                  Visit Seoul
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 월별 전시 정보 수집</li>
                  <li>• 진행중/예정/완료 상태 확인</li>
                  <li>• 서울 지역 전시회 정보</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Icon icon="lucide:landmark" className="text-purple-600" />
                  문화포털
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 전시/공연/축제 카테고리별 수집</li>
                  <li>• 전국 문화행사 정보</li>
                  <li>• 상세한 행사 정보 제공</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Icon icon="lucide:palette" className="text-green-600" />
                  예술의전당
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 예술의전당 전시 정보</li>
                  <li>• 고품질 예술 전시회</li>
                  <li>• 전문적인 전시 정보</li>
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
} 