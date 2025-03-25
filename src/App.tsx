import { useEffect, useRef, useState } from 'react'
import './App.css'
import { CiCircleMinus, CiCirclePlus } from "react-icons/ci";
import { FaChevronRight, FaTrashAlt } from "react-icons/fa";

function App() {
  const [listChar, setListChar] = useState<Record<string, any>[]>([])
  const [randomResult, setRandomResult] = useState<Record<string, any>[]>([])
  const [isTravEleIncluded, setIsTraEleIncluded] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const [navType, setNavType] = useState<number>(1)
  const [storageId, setStorageId] = useState<number>(0)
  const [localSavedGroups, setLocalSavedGroups] = useState<Record<string, any>[]>(JSON.parse(localStorage.getItem('savedGroups')!))
  const resultRef = useRef<HTMLDivElement>(null);

  // Assigning char data to state
  async function charFetch() {
    setLoading(true)
    const url: string = "/data/char_data.json"
    try{
      const response = await fetch(url);
      const result = await response.json();
      const filterTraveler = result.filter((item: Record<string, any>) => !["Aether", "Lumine"].includes(item.name)) // filtering aether and lumine
      const updateTraveler = [...filterTraveler, { id: 10000007, name: "Traveler", version: "1.0", rarity: 5 }].map((item: Record<string, any>) => ({
        ...item,
        active: true
      })) // make traveler only one char
      updateTraveler.sort((a: Record<string, any>, b: Record<string, any>) => parseFloat(a.id) - parseFloat(b.id)); // sort char base on id
      setListChar(updateTraveler)
      setLoading(false)
      
    }catch(e){
      console.log(e);
    }
  }

  useEffect(() => {
    if(listChar.length === 0){
      charFetch()
    }
  }, [])

  // Handle active/used char
  const toggleActive = (id: unknown) => {
    setListChar((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, active: !item.active } : item
      )
    );
  };

  // Handle random grouping
  const groupActiveItems = (items: Record<string, any>[]) => {
    const activeItems = items.filter(item => item.active); // filtering active char
    const shuffled = [...activeItems].sort(() => Math.random() - 0.5); // shufling list of active/used char
    let groups: { group: Record<string, any>[]; star: number }[] = [];
    while(shuffled.length > 0){
      let currentGroup: Record<string, any>[] = []
      let usedNames = new Set(); // handling not double traveler if included elements
      for (let i = 0; i < shuffled.length; i++) {
        if (currentGroup.length >= 8) break;
        const item = shuffled[i];
        if (!usedNames.has(item.name)) {
          usedNames.add(item.name);
          currentGroup.push(item);
          shuffled.splice(i, 1); // Remove from shuffled list
          i--; // Adjust index after splice
        }
      }
      groups.push({ group: currentGroup, star: 0 });
    }
    // handling remaining group
    const lastGroupIndex = groups.length - 1;
    if (groups[lastGroupIndex].group.length < 8) {
      const remainder = groups[lastGroupIndex].group;
      const needed = 8 - remainder.length;
      let usedNames = new Set(remainder.map(item => item.name));
      let extraItems: Record<string, any>[] = []
      for (let item of activeItems.sort(() => Math.random() - 0.5)) {
        if (!usedNames.has(item.name)) {
          usedNames.add(item.name);
          extraItems.push(item);
          if (extraItems.length === needed) break;
        }
      }
      groups[lastGroupIndex].group = [...remainder, ...extraItems];
    }
    // setting local storage 
    const savedGroups: Record<string, any>[] = JSON.parse(localStorage.getItem('savedGroups')!)
    if(savedGroups && savedGroups.length !== 0){
      localStorage.setItem('savedGroups', JSON.stringify([...savedGroups, {id: savedGroups[savedGroups.length -1].id + 1, groups, name: `Saved result ${savedGroups[savedGroups.length -1].id + 1}`, date: Date.now()}]))
      setStorageId(savedGroups[savedGroups.length -1].id + 1)
      setLocalSavedGroups([...savedGroups, {id: savedGroups[savedGroups.length -1].id + 1, groups, name: `Saved result ${savedGroups[savedGroups.length -1].id + 1}`, date: Date.now()}])
    } else {
      localStorage.setItem('savedGroups', JSON.stringify([{id: 1, groups, name: 'Saved result 1', date: Date.now()}]))
      setStorageId(1)
      setLocalSavedGroups([{id: 1, groups, name: 'Saved result 1', date: Date.now()}])
    }
    return groups;
  };

  // date formatting for saved result list
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString(navigator.language, { 
      day: "2-digit", month: "2-digit", year: "numeric", 
      hour: "2-digit", minute: "2-digit", second: '2-digit'
    });
  };

  return (
    <div className="text-slate-100 bg-slate-800 p-4 sm:p-6 md:p-8 rounded-xl">
      <h1 className='mb-8 text-lg sm:text-xl md:text-3xl font-bold'>Spiral Abyss Party Randomizer</h1>
      {/* navbar type 1 = main, 2 = saved, 3 = about */}
      <nav className='flex flex-row mb-6'>
        <button onClick={() => {setNavType(1)}} className={`flex-1 text-center ${navType === 1 ? 'border-t-2 border-l-2 border-r-2 font-extrabold' : 'border-b-2 font-normal underline underline-offset-4'} text-xs sm:text-sm md:text-base py-2`}>Randomize</button>
        <button onClick={() => {setNavType(2)}} className={`flex-1 text-center ${navType === 2 ? 'border-t-2 border-l-2 border-r-2 font-extrabold' : 'border-b-2 font-normal underline underline-offset-4'} text-xs sm:text-sm md:text-base py-2`}>Saved Result</button>
        <button onClick={() => {setNavType(3)}} className={`flex-1 text-center ${navType === 3 ? 'border-t-2 border-l-2 border-r-2 font-extrabold' : 'border-b-2 font-normal underline underline-offset-4'} text-xs sm:text-sm md:text-base py-2`}>About</button>
      </nav>
      {navType === 1 ? (
        <>
          {!loading && (
            <div className='flex flex-col md:flex-row justify-between'>
              <span className='mb-1 md:mb-2 font-semibold text-sm sm:text-base md:text-lg'>Click to exclude/include characters</span>
              <label className="flex mb-2 md:mb-0 text-xs sm:text-sm md:text-base items-center justify-center w-fit cursor-pointer md:space-x-1">
                <input
                  type="checkbox"
                  checked={isTravEleIncluded}
                  onChange={(e) => {
                    setIsTraEleIncluded(!isTravEleIncluded)
                    if(e.target.checked){
                      const filterTraveler = listChar.filter((item: Record<string, any>) => item?.name !== "Traveler")
                      const updateTraveler = [
                        ...filterTraveler, 
                        { id: 10000007, name: "Traveler", version: "1.0", rarity: 5, elementText: "Anemo", active: true },
                        { id: 10000008, name: "Traveler", version: "1.0", rarity: 5, elementText: "Geo", active: true },
                        { id: 10000009, name: "Traveler", version: "1.0", rarity: 5, elementText: "Electro", active: true },
                        { id: 10000010, name: "Traveler", version: "1.0", rarity: 5, elementText: "Dendro", active: true },
                        { id: 10000011, name: "Traveler", version: "1.0", rarity: 5, elementText: "Hydro", active: true },
                        { id: 10000012, name: "Traveler", version: "1.0", rarity: 5, elementText: "Pyro", active: true }
                      ]
                      updateTraveler.sort((a: Record<string, any>, b: Record<string, any>) => parseFloat(a.id) - parseFloat(b.id));
                      setListChar(updateTraveler)
                    } else {
                      const filterTraveler = listChar.filter((item: Record<string, any>) => item?.name !== "Traveler")
                      const updateTraveler = [
                        ...filterTraveler, 
                        { id: 10000007, name: "Traveler", version: "1.0", rarity: 5, active: true },
                      ]
                      updateTraveler.sort((a: Record<string, any>, b: Record<string, any>) => parseFloat(a.id) - parseFloat(b.id));
                      setListChar(updateTraveler)
                    }
                  }}
                  className="hidden"
                />
                <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-gray-600 flex items-center justify-center ${isTravEleIncluded ? "bg-blue-500" : "bg-white"}`}>
                  {isTravEleIncluded && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
                <span>Include traveler's elements</span>
              </label>
            </div>
          )}
          {loading ? (
            <div className='flex justify-center items-center text-lg font-bold italic text-gray-500'>
              Loading data...
            </div>
          ) : (
            <div className='flex flex-wrap gap-2 items-center justify-center'>
              {listChar?.map((char, index) => (
                <div key={index} className={`w-16 h-16 md:w-20 md:h-20 block ${char?.rarity === 4 ? 'bg-[#9c75b7]' : 'bg-[#b27330]'} rounded cursor-pointer ${!char?.active ? 'grayscale' : 'grayscale-0' } relative`} onClick={() => toggleActive(char?.id)} >
                  {char?.name === "Traveler" ? (
                    <>
                    {char?.elementText && 
                      <img src={`/assets/Element_${char?.elementText}.webp`} alt="element" className='absolute z-10 top-0 right-0 w-5' />
                    }
                    <img loading='lazy' src={`https://static.wikia.nocookie.net/gensin-impact/images/5/59/Traveler_Icon.png`} alt="char" />
                    </>
                  ) : (
                    <>
                    <img src={`/assets/Element_${char?.elementText}.webp`} alt="element" className='absolute z-10 top-0 right-0 w-5' />
                    <img loading='lazy' src={`https://api.hakush.in/gi/UI/${char?.images?.filename_icon}.webp`} alt="char" />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
          {!loading && (
            <div className='mt-7 flex justify-center'>
              <button className='px-5 md:px-7 py-1 md:py-2 bg-blue-600 rounded-xl text-base md:text-lg font-semibold' onClick={() => {
                setRandomResult(groupActiveItems(listChar))
                setTimeout(() => {
                  resultRef.current?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
              }>
                Randomize!
              </button>
            </div>
          )}
          {randomResult.length > 0 && (
            <div className='mt-10'>
              <h1 className='text-base sm:text-lg md:text-xl font-bold mb-2' ref={resultRef}>Results:</h1>
              {randomResult.map((item, index) => (
                <div className='flex flex-col mb-5' key={index}>
                  <span className='font-bold mb-2 text-sm md:text-base'>Group {index+1}:</span>
                  <div className='flex flex-row'>
                    <div className='flex flex-1 md:flex-initial flex-wrap gap-2'>
                      {item?.group?.map((char: Record<string, any>, index: number) => (
                        <div key={index} className={`w-16 h-16 lg:w-20 lg:h-20 block ${char?.rarity === 4 ? 'bg-[#9c75b7]' : 'bg-[#b27330]'} rounded relative`}>
                        {char?.name === "Traveler" ? (
                          <>
                          {char?.elementText && 
                            <img src={`/assets/Element_${char?.elementText}.webp`} alt="element" className='absolute z-10 top-0 right-0 w-5' />
                          }
                          <img loading='lazy' src={`https://static.wikia.nocookie.net/gensin-impact/images/5/59/Traveler_Icon.png`} alt="char" />
                          </>
                        ) : (
                          <>
                          <img src={`/assets/Element_${char?.elementText}.webp`} alt="element" className='absolute z-10 top-0 right-0 w-5' />
                          <img loading='lazy' src={`https://api.hakush.in/gi/UI/${char?.images?.filename_icon}.webp`} alt="char" />
                          </>
                        )}
                      </div>
                      ))}
                    </div>
                    <div className='flex flex-col md:flex-row gap-1 justify-center items-center md:ml-3'>
                      <button className={`text-xl ${item?.star === 0 && 'invisible'}`} onClick={() => {
                        const savedGroups: Record<string, any>[] = JSON.parse(localStorage.getItem('savedGroups')!)
                        const result = randomResult.map((g, i) => i === index ? {...g, star: Math.max(0, g.star - 1)} : g)
                        const updatedSavedGroup = savedGroups.map(item => item.id === storageId ? {...item, groups: result} : item)
                        setRandomResult(result)
                        localStorage.setItem("savedGroups", JSON.stringify(updatedSavedGroup))
                        setLocalSavedGroups(updatedSavedGroup)
                      }}>
                        <CiCircleMinus />
                      </button>
                      <div className='flex gap-1 items-center'>
                        <img src="/assets/abyss_star.png" className='w-5 h-5 lg:w-7 lg:h-7' />
                        <span>
                          {item?.star}/9
                        </span>
                      </div>
                      <button className={`text-xl ${item?.star === 9 && 'invisible'}`} onClick={() => {
                        const savedGroups: Record<string, any>[] = JSON.parse(localStorage.getItem('savedGroups')!)                        
                        const result = randomResult.map((g, i) => i === index ? {...g, star: Math.max(0, g.star + 1)} : g)
                        const updatedSavedGroup = savedGroups.map(item => item.id === storageId ? {...item, groups: result} : item)
                        setRandomResult(result)
                        localStorage.setItem("savedGroups", JSON.stringify(updatedSavedGroup))
                        setLocalSavedGroups(updatedSavedGroup)
                      }}>
                        <CiCirclePlus />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : navType === 2 ? (
        <>
          {localSavedGroups && localSavedGroups.length !== 0 ? (
            <div>
              {localSavedGroups?.map((item, index) => (
                <div key={index} className='flex justify-between items-center border-t-2 py-3 border-gray-700'>
                  <div className='flex gap-4'>
                    <button className='text-red-700' onClick={() => {
                      const saved = localSavedGroups.filter(i => i.id !== item.id)
                      setLocalSavedGroups(saved)
                      localStorage.setItem("savedGroups", JSON.stringify(saved))
                    }}>
                      <FaTrashAlt />
                    </button>
                    <div>
                      <h1 className='text-base md:text-lg font-bold'>{item?.name}</h1>
                      <span className='italic text-sm md:text-base text-gray-400'>
                        {formatDate(item?.date)}
                      </span>
                      <div className='flex gap-1 text-sm md:text-base'>
                        <span>{item?.groups?.length} groups</span>
                        <img src="/assets/abyss_star.png" className='w-5 h-5 md:w-7 md:h-7' />
                        <span>
                          {item?.groups?.reduce((sum: number, item: any) => sum + item?.star, 0)}/{item?.groups?.length * 9}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <button className='border text-base md:text-xl p-2 rounded-full' onClick={() => {
                      setRandomResult(item?.groups)
                      setStorageId(item?.id)
                      setNavType(1)
                      setTimeout(() => {
                        resultRef.current?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}>
                      <FaChevronRight />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='p-2 text-center font-bold text-gray-500 text-lg italic'>
              No Saved Result~
            </div>
          )}
        </>
      ) : (
        <div>
          <h1 className='text-base sm:text-lg font-bold mb-3'>Welcome to Spiral Abyss Party Randomizer!</h1>
          <p className='text-sm sm:text-base'>
            Inspired by <a className='text-blue-400 underline underline-offset-2' href="https://www.youtube.com/@mosurameso">Mosurameso (モスラメソ)</a> <a className='text-blue-400 underline underline-offset-2' href="https://www.youtube.com/playlist?list=PLxn0k-vF3UAPQHVKowc_7XW9dYU5te6Ij">all characters roulette Spiral Abyss streams</a>, include character that you have/build to randomly group it.
          </p>
          <ul className='list-disc pl-5 text-sm sm:text-base mb-3'>
            <li>Each group will have 8 random characters</li>
            <li>Use that 8 characters to form a party for first half and second half of floor</li>
            <li>Record the group's star result</li>
            <li>For the last group, if remaining character exists, it'll fill with random character from the included character list (excluding remaining character)</li>
            <li>If Traveler's element not included, you can freely choose the Traveler's element</li>
            <li>Randomized groups results are auto-saved in your local storage, you can check the result's run in Saved Result tab</li>
          </ul>
          <p className='text-sm sm:text-base'>Credits:</p>
          <ul className='list-disc pl-5 mb-5 text-sm sm:text-base'>
            <li>Character images: <a className='text-blue-400 underline underline-offset-2' href="https://gi18.hakush.in/">Hakush.in</a></li>
          </ul>
          <p className='text-gray-400 text-sm sm:text-base'>
            This website is not affiliated with HoYoverse. Genshin Impact, game content and materials are trademarks and copyrights of HoYoverse.
          </p>
        </div>
      )}
    </div>
  )
}

export default App
