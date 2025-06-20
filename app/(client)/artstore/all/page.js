"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardBody, Divider, Spinner, Button, Pagination } from "@heroui/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Skeleton } from "@heroui/react";
import { FaArrowLeft } from "react-icons/fa";

function getWebpImageUrl(url){
  if(!url) return "/noimage.jpg";
  if(url.endsWith(".webp")) return url;
  return url.replace(/\.(jpg|jpeg|png)$/i, ".webp");
}

export default function AllProductsPage(){
  const supabase = createClient();
  const [categories,setCategories]=useState([
    { id:1,name:"추천상품",selected:true,genre:null},
    { id:2,name:"현대미술",selected:false,genre:"현대미술"},
    { id:3,name:"추상화",selected:false,genre:"추상화"},
    { id:4,name:"명화/동양화",selected:false,genre:"명화/동양화"},
    { id:5,name:"사진/일러스트",selected:false,genre:"사진/일러스트"},
    { id:6,name:"기타",selected:false,genre:"기타"},
  ]);
  const [products,setProducts]=useState([]);
  const [loading,setLoading]=useState(true);
  const [page,setPage]=useState(1);
  const [totalPages,setTotalPages]=useState(1);
  const router=useRouter();

  const fetchProducts=async(currentPage,catState)=>{
    try{
      const selectedCat=catState.find(c=>c.selected);
      let query=supabase.from("product").select("*, artist_id(*)",{count:"exact"}).order("created_at",{ascending:false});
      if(selectedCat.id===1){
        query=query.eq("isRecommended",true);
      }else if(selectedCat.genre){
        query=query.not("artist_id","is",null).ilike("artist_id.artist_genre",selectedCat.genre);
      }
      const { data, error, count } = await query.range((currentPage-1)*10,currentPage*10-1);
      if(error){console.log(error);return;}
      const pageItems=(data||[]).filter(p=>p.artist_id && p.artist_id.isArtistApproval);
      setProducts(pageItems);
      if(count!==null){setTotalPages(Math.ceil(count/10));}
    }finally{setLoading(false);} 
  };

  useEffect(()=>{setProducts([]);setPage(1);setTotalPages(1);setLoading(true);fetchProducts(1,categories);},[categories]);

  useEffect(()=>{ if(page>1) fetchProducts(page,categories); },[page]);

  const handleCategoryClick=(id)=>{
    setCategories(categories.map(c=>({...c,selected:c.id===id})));
  };

  const handlePageChange=(p)=>{setPage(p); window.scrollTo({top:0,behavior:'smooth'});} ;

  if(loading){
    return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
  }

  const CategoryButtons=(
    <div className="w-full grid grid-cols-3 grid-rows-2 gap-2 mb-4 mt-2">
      {categories.map(cat=>(
        <Button key={cat.id} variant={cat.selected?"default":"outline"} className={`h-8 rounded-full px-3 py-[9px] whitespace-nowrap text-[13px] font-normal ${cat.selected?"bg-[#0042e0] text-white":"bg-[#f1f5f5] text-[#0a2533]"}`} onClick={()=>handleCategoryClick(cat.id)}>
          {cat.name}
        </Button>
      ))}
    </div>);

  return (
    <div className="flex flex-col items-center w-full max-w-[430px] mx-auto bg-white min-h-screen pb-24">
      <div className="flex items-center w-[90%] justify-between mt-4 mb-4">
        <Button isIconOnly variant="light" className="mr-2" onPress={()=>router.back()}>
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">전체 작품</h2>
        <div className="w-10" />
      </div>
      <div className="w-full px-4 flex flex-col items-center">
        {CategoryButtons}
        <div className="w-full flex flex-col gap-2">
          {products.map((product,idx)=>(
            <div key={product.id}>
              <Card shadow="none" classNames={{base:'gap-x-2 w-full',body:'gap-x-2'}} isPressable onPress={()=>router.push(`/product/${product.id}`)}>
                <CardBody className="flex flex-row items-center">
                  <div className="w-[80px] h-[80px] relative">
                    <Image src={getWebpImageUrl(product.image[0])} alt="product image" fill className="object-contain bg-white"/>
                  </div>
                  <div className="flex flex-col flex-grow ml-2">
                    <p className="text-[14px] font-medium line-clamp-1 text-[#606060]">{product.name}</p>
                    {product.size && <p className="text-[12px] text-[#A0A0A0]">{product.size}</p>}
                    <p className="text-[14px] text-black font-medium">₩{product.price?.toLocaleString()}</p>
                  </div>
                </CardBody>
              </Card>
              {idx < products.length-1 && <Divider orientation="horizontal" className="my-2"/>}
            </div>
          ))}
          {totalPages>1 && (
            <div className="flex justify-center mt-6">
              <Pagination total={totalPages} page={page} onChange={handlePageChange} showControls color="primary" size="sm" className="gap-2"/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 