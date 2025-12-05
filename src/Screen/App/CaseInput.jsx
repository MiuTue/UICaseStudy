import React, { useState, useEffect, useMemo } from "react";
import Footer from "../../components/Footer";
import { backgroundImage2 } from "../../Image/image"; 
import { storage, firestore } from "../../../firebase"; // Import firestore
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore"; // Import firestore functions
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import '@reactflow/core/dist/style.css';


// Hàm tải ảnh lên Firebase Storage
async function uploadImage(file, caseId = '') {
  const safeCaseId = caseId.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'unknown_case';
  const imageRef = ref(storage, `case_backgrounds/${safeCaseId}/${Date.now()}-${file.name}`);

  await uploadBytes(imageRef, file);
  return await getDownloadURL(imageRef); // URL không lỗi CORS
}


export default function CaseInput() {
  const [activeTab, setActiveTab] = useState("skeleton");
  const [isDraftModalOpen, setDraftModalOpen] = useState(false);

  // State for Draft Modal
  const [draftState, setDraftState] = useState({
    prompt: "",
    topic: "",
    personaCount: "",
    location: "",
    isLoading: false,
  });

  // State for Background Image Generator
  const [backgroundState, setBackgroundState] = useState({
    prompt: "",
    json: "",
    seed: "",
    filename: "",
    imageUrl: null, // To store Data URL of the image
    file: null, // To store the actual File object for later upload
    isLoading: false,
  });
  const SUCCESS_LEVEL_SCORES = [5, 4, 3, 2, 1];

  const newSuccessCriterion = () => ({
    description: "",
    levels: SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {}),
  });

  const newCanonEvent = () => ({ id: "", title: "", description: "", npc_appearance: "", timeout_turn: 0, success_criteria: [newSuccessCriterion()], on_score_branches: SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {}), on_success: "", on_fail: "" });

  // Functions to get initial state structures
  const getInitialSkeletonState = () => ({
    case_id: "",
    title: "",
    canon_events: [newCanonEvent()],
  });

  const getInitialContextState = () => ({
    case_id: "",
    topic: "",
    scene: { time: "", weather: "", location: "", noise: "" },
    index_event: { summary: "", current_state: "", who_first: "" },
    constraints: "",
    policies: "",
    handover: "",
    success_state: "",
    background_image: "", // Thêm trường để lưu URL ảnh nền
    resources: [{ label: "", note: "", items: "" }],
  });

  const getInitialPersonasState = () => ({
    case_id: "",
    count: 1,
    personas: [{
      id: "",
      name: "",
      role: "",
      age: "",
      gender: "",
      background: "",
      personality: "",
      goal: "",
      speech_pattern: "",
      emotion_init: "",
      emotion_during: "",
      emotion_end: "",
      voice_tags: "",
    }],
  });

  // State for each form
  const [skeleton, setSkeleton] = useState(getInitialSkeletonState());
  const [context, setContext] = useState(getInitialContextState());
  const [personas, setPersonas] = useState(getInitialPersonasState());

  // Sync Case ID
  useEffect(() => {
    const caseIds = [skeleton.case_id, context.case_id, personas.case_id].filter(Boolean);
    const primaryCaseId = caseIds[0] || "";
    if (skeleton.case_id !== primaryCaseId) {
      setSkeleton(prev => ({ ...prev, case_id: primaryCaseId }));
    }
    if (context.case_id !== primaryCaseId) {
      setContext(prev => ({ ...prev, case_id: primaryCaseId }));
    }
    if (personas.case_id !== primaryCaseId) {
      setPersonas(prev => ({ ...prev, case_id: primaryCaseId }));
    }
  }, [skeleton.case_id, context.case_id, personas.case_id]);

  const handleCaseIdChange = (e, formSetter) => {
    const newCaseId = e.target.value;
    setSkeleton(prev => ({ ...prev, case_id: newCaseId }));
    setContext(prev => ({ ...prev, case_id: newCaseId }));
    setPersonas(prev => ({ ...prev, case_id: newCaseId }));
  };

  // --- Handlers for Skeleton Form ---
  const handleSkeletonChange = (e) => {
    const { name, value } = e.target;
    setSkeleton(prev => ({ ...prev, [name]: value }));
  };

  const handleEventChange = (e, eventIndex) => {
    const { name, value } = e.target;
    setSkeleton(prev => {
      const newEvents = [...prev.canon_events];
      newEvents[eventIndex] = { ...newEvents[eventIndex], [name]: value };
      return { ...prev, canon_events: newEvents };
    });
  };

  const handleAddEvent = () => {
    setSkeleton((prev) => ({
      ...prev,
      canon_events: [...prev.canon_events, newCanonEvent()],
    }));
  };

  const handleRemoveEvent = (index) => {
    if (skeleton.canon_events.length === 1) {
      setSkeleton(prev => ({ ...prev, canon_events: [newCanonEvent()] }));
      return;
    }
    setSkeleton((prev) => ({
      ...prev,
      canon_events: prev.canon_events.filter((_, i) => i !== index),
    }));
  };

  const handleAddSuccessCriterion = (eventIndex) => {
    setSkeleton(prev => {
      const newEvents = [...prev.canon_events];
      newEvents[eventIndex].success_criteria.push(newSuccessCriterion());
      return { ...prev, canon_events: newEvents };
    });
  };

  const handleRemoveSuccessCriterion = (eventIndex, critIndex) => {
    setSkeleton(prev => {
      const newEvents = [...prev.canon_events];
      if (newEvents[eventIndex].success_criteria.length === 1) {
        newEvents[eventIndex].success_criteria = [newSuccessCriterion()];
      } else {
        newEvents[eventIndex].success_criteria = newEvents[eventIndex].success_criteria.filter((_, i) => i !== critIndex);
      }
      return { ...prev, canon_events: newEvents };
    });
  };

  const handleSuccessCriterionChange = (e, eventIndex, critIndex) => {
    const { name, value } = e.target;
    setSkeleton(prev => {
      const newEvents = [...prev.canon_events];
      newEvents[eventIndex].success_criteria[critIndex][name] = value;
      return { ...prev, canon_events: newEvents };
    });
  };

  const handleLevelDescriptorChange = (e, eventIndex, critIndex, level) => {
    const { value } = e.target;
    setSkeleton(prev => {
      const newEvents = [...prev.canon_events];
      const criterion = newEvents[eventIndex].success_criteria[critIndex];
      // Ensure .levels object exists before setting a property on it
      if (!criterion.levels) {
        criterion.levels = {};
      }
      criterion.levels[level] = value;
      return { ...prev, canon_events: newEvents };
    });
  };

  const handleBranchChange = (e, eventIndex, score) => {
    const { value } = e.target;
    setSkeleton(prev => {
      const newEvents = [...prev.canon_events];
      // Ensure .on_score_branches object exists
      if (!newEvents[eventIndex].on_score_branches) {
        newEvents[eventIndex].on_score_branches = {};
      }
      newEvents[eventIndex].on_score_branches[score] = value;
      return { ...prev, canon_events: newEvents };
    });
  };

  const handleResetBranches = (eventIndex) => {
    setSkeleton(prev => {
      const newEvents = [...prev.canon_events];
      newEvents[eventIndex].on_score_branches = SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {});
      return { ...prev, canon_events: newEvents };
    });
  };

  // --- Handlers for Context Form ---
  const handleContextChange = (e) => {
    const { name, value } = e.target;
    setContext(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedContextChange = (e, parentKey) => {
    const { name, value } = e.target;
    setContext(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [name]: value
      }
    }));
  };

  const handleResourceChange = (e, index) => {
    const { name, value } = e.target;
    setContext(prev => {
      const newResources = [...prev.resources];
      newResources[index] = { ...newResources[index], [name]: value };
      return { ...prev, resources: newResources };
    });
  };

  // --- Handlers for Personas Form ---
  const handlePersonaChange = (e, index) => {
    const { name, value } = e.target;
    setPersonas(prev => {
      const newPersonas = [...prev.personas];
      newPersonas[index] = { ...newPersonas[index], [name]: value };
      return { ...prev, personas: newPersonas };
    });
  };
  const handleAddResource = () => {
    setContext((prev) => ({
      ...prev,
      resources: [...prev.resources, { label: "", note: "", items: "" }],
    }));
  };

  const handleRemoveResource = (index) => {
    if (context.resources.length === 1) {
      setContext(prev => ({ ...prev, resources: [{ label: "", note: "", items: "" }] }));
      return;
    }
    setContext((prev) => ({
      ...prev,
      resources: prev.resources.filter((_, i) => i !== index),
    }));
  };

  // --- Handlers for Personas Form ---
  const handleAddPersona = () => { // This was misplaced, moving it down for clarity but it's fine here.
    setPersonas((prev) => ({
      ...prev,
      personas: [
        ...prev.personas,
        {
          id: "",
          name: "",
          role: "",
          age: "",
          gender: "",
          background: "",
          personality: "",
          goal: "",
          speech_pattern: "",
          emotion_init: "",
          emotion_during: "",
          emotion_end: "",
          voice_tags: "",
        },
      ],
    }));
  };

  const handleRemovePersona = (index) => {
    if (personas.personas.length === 1) {
      // Reset the single persona instead of removing
      setPersonas(prev => ({ ...prev, personas: [getInitialPersonasState().personas[0]] }));
    }
    setPersonas((prev) => ({
      ...prev,
      personas: prev.personas.filter((_, i) => i !== index),
    }));
  };

  // --- Generic Handlers ---
  const handleFileChange = (type, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // This logic mimics the normalization in nhap-case.js
          if (type === "skeleton") {
            const skeletonData = data.skeleton || data;

            // Normalize dữ liệu giống như khi sinh case tự động
            if (Array.isArray(skeletonData.canon_events)) {
              skeletonData.canon_events.forEach(event => {
                // 1. Chuẩn hóa npc_appearance từ mảng object sang chuỗi
                if (Array.isArray(event.npc_appearance)) {
                  event.npc_appearance = event.npc_appearance.map(npc => {
                    if (npc && npc.persona_id) {
                      return npc.role ? `${npc.persona_id}: ${npc.role}` : npc.persona_id;
                    }
                    return '';
                  }).filter(Boolean).join('\n');
                }

                // 2. Chuẩn hóa success_criteria.levels từ mảng object sang object
                if (Array.isArray(event.success_criteria)) {
                  event.success_criteria.forEach(criterion => {
                    if (Array.isArray(criterion.levels)) {
                      const levelsObject = criterion.levels.reduce((acc, level) => {
                        if (level && typeof level.score !== 'undefined') {
                          acc[level.score] = level.descriptor || "";
                        }
                        return acc;
                      }, {});
                      criterion.levels = levelsObject;
                    } else if (!criterion.levels) {
                      criterion.levels = SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {});
                    }
                  });
                }

                // 3. Đảm bảo on_score_branches tồn tại và điền dữ liệu từ on_success/on_fail
                if (!event.on_score_branches) {
                  event.on_score_branches = SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {});
                }
                if (event.on_success) {
                  [5, 4, 3].forEach(score => { if (!event.on_score_branches[score]) event.on_score_branches[score] = event.on_success; });
                }
                if (event.on_fail) {
                  [2, 1].forEach(score => { if (!event.on_score_branches[score]) event.on_score_branches[score] = event.on_fail; });
                }
              });
            }
            setSkeleton(prev => ({ ...getInitialSkeletonState(), ...prev, ...skeletonData }));
          }
          if (type === "context") {
            const contextData = data.context || data;
            const initialContext = contextData.initial_context || {};

            // Giải nén 'resources' từ 'available_resources' và 'available_resources_meta'
            const unpackedResources = [];
            if (initialContext.available_resources && typeof initialContext.available_resources === 'object') {
              Object.keys(initialContext.available_resources).forEach(key => {
                const meta = initialContext.available_resources_meta?.[key] || {};
                const items = initialContext.available_resources[key];
                unpackedResources.push({
                  label: meta.label || key,
                  note: meta.note || '',
                  items: Array.isArray(items) ? items.join('\n') : (items || ''),
                });
              });
            }

            // Chuyển đổi các trường mảng thành chuỗi ký tự, mỗi phần tử một dòng
            const constraintsStr = Array.isArray(initialContext.constraints) ? initialContext.constraints.join('\n') : (initialContext.constraints || '');
            const policiesStr = Array.isArray(initialContext.policies_safety_legal) ? initialContext.policies_safety_legal.join('\n') : (initialContext.policies_safety_legal || '');

            const newContext = {
              ...getInitialContextState(), // Bắt đầu với state rỗng để đảm bảo sạch sẽ
              case_id: contextData.case_id || '',
              topic: contextData.topic || '',
              scene: initialContext.scene || { time: "", weather: "", location: "", noise: "" },
              index_event: initialContext.index_event || { summary: "", current_state: "", who_first: "" },
              constraints: constraintsStr,
              policies: policiesStr,
              handover: initialContext.handover_target || '',
              success_state: initialContext.success_end_state || '',
              background_image: initialContext.background_image || '',
              resources: unpackedResources.length > 0 ? unpackedResources : getInitialContextState().resources,
            };
            setContext(newContext);
          }
          if (type === "personas") {
            let personasData = {};
            if (data.personas && Array.isArray(data.personas.personas)) {
              personasData = data.personas; // Dữ liệu đã có cấu trúc { case_id, count, personas: [...] }
            } else if (Array.isArray(data.personas)) {
              personasData = { case_id: data.case_id, personas: data.personas, count: data.personas.length };
            } else {
              personasData = data;
            }
            // Chuẩn hóa dữ liệu mảng sang chuỗi
            if (Array.isArray(personasData.personas)) {
              personasData.personas.forEach(persona => {
                if (Array.isArray(persona.emotion_during)) {
                  persona.emotion_during = persona.emotion_during.join('\n');
                }
                if (Array.isArray(persona.voice_tags)) {
                  persona.voice_tags = persona.voice_tags.join(', ');
                }
              });
            }
            setPersonas(prev => ({ ...getInitialPersonasState(), ...prev, ...personasData }));
          }
          alert(`Đã tải thành công file ${file.name}`);
        } catch (error) {
          alert("Lỗi: File JSON không hợp lệ.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveCase = async () => {
    let caseId = skeleton.case_id || context.case_id || personas.case_id;
    if (!caseId) {
      alert("Vui lòng nhập Case ID trước khi lưu.");
      return;
    }

    let finalBackgroundImageUrl = context.background_image;

    // 1. Check if there's a new background image to upload
    if (backgroundState.file) {
      try {
        // Tải ảnh lên Storage
        finalBackgroundImageUrl = await uploadImage(backgroundState.file, caseId);
        // Lưu URL vào collection 'backgrounds' trên Firestore
        const backgroundDocRef = doc(firestore, "backgrounds", caseId);
        await setDoc(backgroundDocRef, { case_id: caseId, background_image_url: finalBackgroundImageUrl });
      } catch (error) {
        alert(`Lỗi khi tải ảnh nền lên Firebase: ${error.message}. Vui lòng thử lại.`);
        return; // Stop the save process if image upload fails
      }
    }

    // Xây dựng lại đối tượng available_resources và meta từ state
    const available_resources = {};
    const available_resources_meta = {};
    context.resources.forEach(resource => {
      if (resource.label) {
        const key = resource.label.replace(/\s+/g, '-').toLowerCase();
        available_resources[key] = resource.items.split('\n').filter(Boolean);
        available_resources_meta[key] = {
          label: resource.label,
          note: resource.note,
        };
      }
    });

    // Xây dựng lại đối tượng skeleton để khớp với cấu trúc DB
    const skeletonForSave = {
      ...skeleton,
      canon_events: skeleton.canon_events.map(event => {
        // Chuyển đổi success_criteria.levels từ object sang array of objects
        const newSuccessCriteria = event.success_criteria.map(criterion => ({
          ...criterion,
          levels: Object.entries(criterion.levels || {}).map(([score, descriptor]) => ({
            score: parseInt(score, 10),
            descriptor: descriptor || ""
          })).sort((a, b) => b.score - a.score) // Sắp xếp từ cao đến thấp
        }));

        // Chuyển đổi npc_appearance từ string sang array of objects
        const newNpcAppearance = (event.npc_appearance || '')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line)
          .map(line => {
            const parts = line.split(':');
            const persona_id = parts[0]?.trim();
            const role = parts.length > 1 ? parts.slice(1).join(':').trim() : '';
            return { persona_id, role };
          });

        return { ...event, success_criteria: newSuccessCriteria, npc_appearance: newNpcAppearance, preconditions: [] }; // Thêm preconditions rỗng
      })
    };

    // 2. Prepare the final data for saving
    const finalCase = {
      case_id: caseId,
      skeleton: skeletonForSave,
      context: {
        topic: context.topic,
        initial_context: {
          scene: context.scene,
          index_event: context.index_event,
          available_resources: available_resources,
          constraints: context.constraints.split('\n').filter(Boolean),
          policies_safety_legal: context.policies.split('\n').filter(Boolean),
          handover_target: context.handover,
          success_end_state: context.success_state,
          available_resources_meta: available_resources_meta,
          background_image: finalBackgroundImageUrl,
        }
      },
      personas: {
        ...personas,
        personas: personas.personas.map(p => ({
          ...p,
          emotion_during: typeof p.emotion_during === 'string' ? p.emotion_during.split('\n').filter(Boolean) : [],
          voice_tags: typeof p.voice_tags === 'string' ? p.voice_tags.split(/, */).filter(Boolean) : [],
        }))
      },
    };

    try {
      const response = await fetch('http://localhost:8000/api/cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalCase),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Lỗi từ server.');
      }

      alert(result.message || `Đã lưu case '${caseId}' thành công. Trang sẽ được tải lại.`);
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Đợi 1.5 giây trước khi tải lại trang

    } catch (error) {
      console.error("Error saving case:", error);
      alert(`Lỗi khi lưu case: ${error.message}`);
    }
  };

  const handleExportJson = (type) => {
    let dataToSave;
    let caseId;

    switch (type) {
      case "skeleton":
        dataToSave = { skeleton };
        caseId = skeleton.case_id;
        break;
      case "context":
        dataToSave = { context };
        caseId = context.case_id;
        break;
      case "personas":
        dataToSave = { personas };
        caseId = personas.case_id;
        break;
      default:
        console.error("Invalid export type");
        return;
    }

    const finalCaseId = caseId || "draft";
    const fileName = `${finalCaseId.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${type}.json`;
    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Đã lưu file ${fileName}`);
  };

  const handleClearData = (type) => {
    // This is a placeholder. You can implement logic to reset the state.
    alert(`Chức năng xóa dữ liệu cho ${type} chưa được triển khai.`);
  };

  const handleDraftInputChange = (e) => {
    const { name, value } = e.target;
    setDraftState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitDraft = async (e) => {
    e.preventDefault();
    if (!draftState.prompt.trim()) {
      alert("Vui lòng nhập Prompt tự do để sinh case.");
      return;
    }

    setDraftState(prev => ({ ...prev, isLoading: true }));

    const payload = {
      prompt: draftState.prompt,
      topic: draftState.topic,
      location: draftState.location,
      persona_count: draftState.personaCount ? parseInt(draftState.personaCount, 10) : undefined,
      ensure_minimum_personas: true,
    };

    try {
      // API call to port 9000 as requested
      const response = await fetch('http://localhost:9000/api/cases/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Lỗi khi sinh case tự động.');
      }

      const draftData = await response.json();

      // Log the raw data received from the API
      console.log("Dữ liệu nhận được từ API sinh case:", JSON.stringify(draftData, null, 2));

      // Apply data to forms
      if (draftData.skeleton) {
        const skeletonFromApi = draftData.skeleton;

        // Normalize success_criteria.levels from array of objects to object keyed by score
        if (Array.isArray(skeletonFromApi.canon_events)) {
          skeletonFromApi.canon_events.forEach(event => {
            // Normalize npc_appearance from array of objects to string
            if (Array.isArray(event.npc_appearance)) {
              event.npc_appearance = event.npc_appearance.map(npc => {
                if (npc && npc.persona_id) {
                  return npc.role ? `${npc.persona_id}: ${npc.role}` : npc.persona_id;
                }
                return '';
              }).filter(Boolean).join('\n');
            } else if (typeof event.npc_appearance === 'object' && event.npc_appearance !== null) {
              // Handle case where it might be a single object instead of array
              event.npc_appearance = ''; 
            }

            if (Array.isArray(event.success_criteria)) {
              event.success_criteria.forEach(criterion => {
                if (Array.isArray(criterion.levels)) {
                  const levelsObject = criterion.levels.reduce((acc, level) => {
                    if (level && level.score) {
                      acc[level.score] = level.descriptor || "";
                    }
                    return acc;
                  }, {});
                  criterion.levels = levelsObject;
                } else if (!criterion.levels) {
                  // If levels is missing entirely, initialize it
                  criterion.levels = SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {});
                }
              });
            }
            // Ensure on_score_branches exists and apply defaults if needed
            if (!event.on_score_branches) {
              event.on_score_branches = SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {});
            }
            // If on_success/on_fail exist, they can be used to populate branches as a fallback
            // This logic is now more robust to handle various draft structures.
            if (event.on_success) event.on_score_branches[3] = event.on_score_branches[3] || event.on_success;
            if (event.on_fail) event.on_score_branches[2] = event.on_score_branches[2] || event.on_fail;
          });
        }

        const newSkeleton = { ...getInitialSkeletonState(), ...skeletonFromApi };
        setSkeleton(newSkeleton);
      }

      if (draftData.context) {
        const contextFromApi = draftData.context;
        const initialContext = contextFromApi.initial_context || {};

        // Unpack resources from available_resources and available_resources_meta
        const unpackedResources = [];
        if (initialContext.available_resources && typeof initialContext.available_resources === 'object') {
          Object.keys(initialContext.available_resources).forEach(key => {
            const meta = initialContext.available_resources_meta?.[key] || {};
            const items = initialContext.available_resources[key];
            unpackedResources.push({
              label: meta.label || key,
              note: meta.note || '',
              items: Array.isArray(items) ? items.join('\n') : '',
            });
          });
        }

        const newContext = {
          ...getInitialContextState(),
          case_id: contextFromApi.case_id || draftData.case_id,
          topic: contextFromApi.topic || initialContext.topic || '',
          scene: initialContext.scene || {},
          index_event: initialContext.index_event || {},
          constraints: Array.isArray(contextFromApi.constraints) ? contextFromApi.constraints.join('\n') : (contextFromApi.constraints || ''),
          policies: Array.isArray(contextFromApi.policies) ? contextFromApi.policies.join('\n') : (contextFromApi.policies || ''),
          handover: contextFromApi.handover || '',
          success_state: contextFromApi.success_state || '',
          resources: unpackedResources.length > 0 ? unpackedResources : getInitialContextState().resources,
        };
        setContext(newContext);
      }

      if (draftData.personas) {
        // Normalize emotion_during and voice_tags from array to string
        if (Array.isArray(draftData.personas.personas)) {
          draftData.personas.personas.forEach(persona => {
            if (Array.isArray(persona.emotion_during)) {
              persona.emotion_during = persona.emotion_during.join('\n');
            }
            if (Array.isArray(persona.voice_tags)) {
              persona.voice_tags = persona.voice_tags.join(', ');
            }
          });
        }
        const newPersonas = { ...getInitialPersonasState(), ...draftData.personas };
        if (!newPersonas.count && Array.isArray(newPersonas.personas)) {
          newPersonas.count = newPersonas.personas.length;
        }
        setPersonas(newPersonas);
      }

      alert(`Đã sinh case gợi ý '${draftData.case_id}' thành công.`);
      
      // Show warnings if any
      if (draftData.warnings && draftData.warnings.length > 0) {
        setTimeout(() => {
          alert("Lưu ý từ hệ thống:\n- " + draftData.warnings.join("\n- "));
        }, 100);
      }

      setDraftModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Error generating draft case:", error);
      alert(`Lỗi: ${error.message}`);
    } finally {
      setDraftState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleBackgroundImageUpload = (file) => {
    if (file && file.type.startsWith("image/")) {
      // Chỉ hiển thị ảnh preview tạm thời, không tải lên ngay
      const localUrl = URL.createObjectURL(file);
      setBackgroundState(prev => ({
        ...prev,
        imageUrl: localUrl,
        file: file, // Lưu file object để tải lên sau
        filename: file.name,
        isLoading: false
      }));
      // Xóa URL ảnh đã lưu trên context để ưu tiên ảnh mới
      setContext(prev => ({ ...prev, background_image: '' }));
    } else {
      alert("Vui lòng chọn một file ảnh hợp lệ (jpg, png, etc.).");
    }
  };

  const handleDownloadImage = () => {
    // Ưu tiên ảnh mới chưa lưu (local URL) hoặc ảnh đã lưu trên context
    const url = backgroundState.imageUrl || context.background_image;
    if (!url) {
      alert("Chưa có ảnh để lưu.");
      return;
    }

    const link = document.createElement("a");
    link.href = url; // Không dùng backgroundState.imageUrl nếu nó đang là blob
    link.download = backgroundState.filename || "background.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBackgroundInputChange = (e) => {
    const { name, value } = e.target;
    setBackgroundState(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerateBackground = async () => {
    const caseId = skeleton.case_id;
    if (!caseId) {
      alert("Vui lòng nhập Case ID trước khi sinh ảnh nền.");
      return;
    }

    setBackgroundState(prev => ({ ...prev, isLoading: true }));

    // Tự động tạo prompt từ context
    const contextDescriptionParts = [];
    if (context.scene?.location) contextDescriptionParts.push(`Bối cảnh tại ${context.scene.location}.`);
    if (context.scene?.time) contextDescriptionParts.push(`Thời gian khoảng ${context.scene.time}.`);
    if (context.scene?.weather) contextDescriptionParts.push(`Thời tiết ${context.scene.weather}.`);
    if (context.index_event?.summary) contextDescriptionParts.push(`Sự kiện chính: ${context.index_event.summary}.`);
    if (context.index_event?.current_state) contextDescriptionParts.push(`Tình trạng hiện tại: ${context.index_event.current_state}.`);

    const generatedPrompt = contextDescriptionParts.join(' ');

    // Kết hợp prompt tự động và prompt tùy chọn từ người dùng
    const finalPrompt = [generatedPrompt, backgroundState.prompt].filter(Boolean).join(' - ');

    const payload = {
      case_id: caseId,
      prompt: finalPrompt,
      scene: context.scene,
      index_event: context.index_event,
    };

    try {
      const response = await fetch('http://localhost:9000/api/cases/background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Lỗi khi sinh ảnh nền.');
      }

      const result = await response.json();
      const { image_base64, file_name, message } = result;

      // Convert base64 to File object
      const imageBlob = await (await fetch(`data:image/png;base64,${image_base64}`)).blob();
      const imageFile = new File([imageBlob], file_name || 'generated-background.png', { type: 'image/png' });

      // Chỉ lưu file và hiển thị preview, không tải lên ngay
      const localUrl = URL.createObjectURL(imageFile);
      setBackgroundState(prev => ({
        ...prev,
        imageUrl: localUrl,
        file: imageFile, // Lưu file object để tải lên sau
        filename: file_name,
        seed: result.seed,
        isLoading: false
      }));
      setContext(prev => ({ ...prev, background_image: '' })); // Xóa URL cũ

    } catch (error) {
      console.error("Error generating background image:", error);
      alert(`Lỗi: ${error.message}`);
      setBackgroundState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative flex min-h-screen flex-col" 
         style={{
                  backgroundImage: `linear-gradient(rgba(20,30,50,0.85), rgba(20,30,50,0.95)), url(${backgroundImage2})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'fixed',
                }}
      >
        <main className="flex-1 px-4 sm:px-6 py-12 text-slate-100">
        <div className="mx-auto flex max-w-6xl flex-col gap-12">
          {/* JSON Upload Section */}
          <section className="rounded-3xl border border-slate-700 bg-slate-800/30 backdrop-blur-lg p-8 shadow-2xl shadow-slate-900/50">
            <div className="flex flex-col items-center gap-3 text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-500/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary-300">
                Nhập liệu
              </span>
              <h1 className="text-3xl font-bold text-white drop-shadow-md">
                Trang Nhập Case
              </h1>
              <p className="max-w-2xl text-sm text-slate-300">
                Tải lần lượt 3 tệp Skeleton, Context và Personas để tự động điền
                biểu mẫu. Bạn vẫn có thể chỉnh sửa thủ công trước khi lưu case.
              </p>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2 text-center">
              <button
                type="button"
                onClick={() => setDraftModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-transform duration-200 hover:scale-105 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              >
                Sinh case tự động
              </button>
              <p className="text-xs text-slate-400">
                Nhập prompt tự do hoặc chủ đề chi tiết để hệ thống gợi ý case
                hoàn chỉnh nhanh chóng.
              </p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {["skeleton", "context", "personas"].map((type) => (
                <div
                  key={type}
                  className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 p-6 text-center shadow-lg shadow-slate-900/20 transition-all duration-300 focus-within:border-primary-500/70 focus-within:shadow-primary-500/10 hover:-translate-y-1 hover:border-primary-500/70 hover:bg-slate-800/80"
                  tabIndex="0"
                  role="button"
                  aria-label={`Nhập file ${type.charAt(0).toUpperCase() + type.slice(1)} JSON`}
                  onClick={() => document.getElementById(`file-input-${type}`).click()}
                >
                  <input
                    id={`file-input-${type}`}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={(e) => handleFileChange(type, e.target.files[0])}
                  />
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-400">
                    {type} JSON
                  </span>
                  <p className="text-sm font-semibold text-slate-100">
                    Chọn tệp {type}.json
                  </p>
                  <p className="max-w-[16rem] text-xs text-slate-400">
                    Nhấn để tải lên
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn sự kiện click của div cha
                        document.getElementById(`file-input-${type}`).click();
                      }}
                      className="rounded-full bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md shadow-primary-500/20 transition-transform duration-200 hover:scale-105 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Chọn file
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleExportJson(type); }}
                      className="rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300 transition-transform duration-200 hover:scale-105 hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      Luu JSON
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleClearData(type); }}
                      className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold text-slate-400 transition-transform duration-200 hover:scale-105 hover:border-slate-500 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tabs and Panels Section */}
          <section className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3" role="tablist">
                {["skeleton", "context", "personas", "flow"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                      activeTab === tab
                        ? "border-transparent bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-500"
                        : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-700/70 hover:text-white"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSaveCase}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-transform duration-200 hover:scale-105 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:opacity-60"
              >
                Lưu Toàn Bộ Case
              </button>
            </div>

            <div className="rounded-3xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/20">
              {/* Skeleton Panel */}
              <section hidden={activeTab !== "skeleton"} className="space-y-8">
                <header className="space-y-1"><h2 className="text-2xl font-bold text-white">Skeleton</h2><p className="text-sm text-slate-300">Thông tin tổng quan và danh sách Canon Event.</p></header>
                <form className="space-y-8">
                  {/* Basic Skeleton Fields */}
                  <div className="grid gap-6 md:grid-cols-2" data-basic-fields="skeleton">
                    <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                      Case ID
                      <input type="text" name="case_id" value={skeleton.case_id || ''} onChange={handleCaseIdChange} placeholder="ví dụ: case_training_001" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                    </label>
                    <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                      Tên case
                      <input type="text" name="title" value={skeleton.title || ''} onChange={handleSkeletonChange} placeholder="Tên case hiển thị trong hệ thống" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                    </label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">
                        Canon Events
                      </h3>
                      <button type="button" onClick={handleAddEvent} className="inline-flex items-center gap-2 rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400">
                        + Thêm canon event
                      </button>
                    </div>
                    {/* Canon Events List */}
                    <div className="space-y-6">
                      {skeleton.canon_events.map((event, eventIndex) => (
                        <article key={eventIndex} className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-100">Canon Event #{eventIndex + 1}</h4>
                            <button type="button" onClick={() => handleRemoveEvent(eventIndex)} className="text-xs font-semibold text-rose-600 transition hover:text-rose-500">Xóa</button>
                          </div>
                          <div className="grid gap-6 md:grid-cols-2">
                            <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">Mã sự kiện<input name="id" value={event.id || ''} onChange={(e) => handleEventChange(e, eventIndex)} type="text" placeholder="canon_event_01" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">Tiêu đề<input name="title" value={event.title || ''} onChange={(e) => handleEventChange(e, eventIndex)} type="text" placeholder="Tên canon event" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Mô tả chi tiết<textarea name="description" value={event.description || ''} onChange={(e) => handleEventChange(e, eventIndex)} rows="3" placeholder="Diễn giải tình huống, yếu tố quan trọng..." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">NPC xuất hiện<textarea name="npc_appearance" value={event.npc_appearance || ''} onChange={(e) => handleEventChange(e, eventIndex)} rows="3" placeholder="Định dạng: persona_id: vai trò (mỗi dòng hoặc cách nhau bởi dấu phẩy)" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">Timeout (lượt)<input name="timeout_turn" value={event.timeout_turn || 0} onChange={(e) => handleEventChange(e, eventIndex)} type="number" min="0" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                          </div>

                          {/* Success Criteria Section */}
                          <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">Success Criteria</span>
                              <button type="button" onClick={() => handleAddSuccessCriterion(eventIndex)} className="text-xs font-semibold text-primary-600 transition hover:text-primary-500 focus:outline-none">Thêm tiêu chí</button>
                            </div>
                            <p className="text-xs text-slate-400">Mỗi tiêu chí gồm phần mô tả và 5 mức đánh giá (điểm 5 đến 1).</p>
                            <div className="space-y-4">
                              {Array.isArray(event.success_criteria) && event.success_criteria.map((criterion, critIndex) => (
                                <div key={critIndex} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 shadow-inner space-y-4">
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-slate-200">Tiêu chí</span>
                                    <button type="button" onClick={() => handleRemoveSuccessCriterion(eventIndex, critIndex)} className="text-xs font-semibold text-slate-400 transition hover:text-rose-500 focus:outline-none">Xóa</button>
                                  </div>
                                  <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                                    Mô tả tiêu chí
                                    <input type="text" name="description" value={criterion?.description || ''} onChange={(e) => handleSuccessCriterionChange(e, eventIndex, critIndex)} placeholder="ví dụ: CPR – Đánh giá hiệu quả..." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                                  </label>
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Mức 5 (Xuất sắc)<textarea rows="2" value={criterion?.levels?.[5] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 5)} placeholder="Mô tả cụ thể cho điểm 5." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                    <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Mức 4<textarea rows="2" value={criterion?.levels?.[4] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 4)} placeholder="Mô tả cụ thể cho điểm 4." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                    <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Mức 3<textarea rows="2" value={criterion?.levels?.[3] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 3)} placeholder="Mô tả cụ thể cho điểm 3." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                    <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">Mức 2<textarea rows="2" value={criterion?.levels?.[2] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 2)} placeholder="Mô tả cụ thể cho điểm 2." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                    <label className="text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Mức 1 (Thấp nhất)<textarea rows="2" value={criterion?.levels?.[1] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 1)} placeholder="Mô tả cụ thể cho điểm 1." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Outcome Branching Section */}
                          <div className="mt-4 space-y-3">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <span className="text-sm font-semibold uppercase tracking-wide text-primary-400">Rẽ nhánh theo thang điểm 5</span>
                                <p className="text-xs text-slate-400">Chỉ cần nhập 5 nhánh tương ứng điểm 5 → 1 (điểm cao là tốt nhất, điểm thấp là thất bại).</p>
                              </div>
                              <button type="button" onClick={() => handleResetBranches(eventIndex)} className="text-xs font-semibold text-primary-600 transition hover:text-primary-500 focus:outline-none">Xóa nhánh</button>
                            </div>
                            <div className="space-y-2">
                              {SUCCESS_LEVEL_SCORES.map((score) => (
                                <label key={score} className="block space-y-1 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">Điểm {score}</span>
                                  <input type="text" value={event.on_score_branches?.[score] || ''} onChange={(e) => handleBranchChange(e, eventIndex, score)} placeholder={`Nhánh kế tiếp khi đạt điểm ${score}.`} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                                </label>
                              ))}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("context")}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Sang Context →
                    </button>
                  </div>
                </form>
              </section>

              {/* Context Panel */}
              <section hidden={activeTab !== "context"} className="space-y-8">
                <header className="space-y-1">
                  <h2 className="text-2xl font-bold text-white">
                    Context
                  </h2>
                  <p className="text-sm text-slate-300">
                    Bối cảnh, resource và điều kiện hiện trường.
                  </p>
                </header>
                <form className="space-y-8">
                  {/* Basic Context Fields */}
                  <div className="grid gap-6 md:grid-cols-2">
                     <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">Case ID<input name="case_id" type="text" value={context.case_id || ''} onChange={handleCaseIdChange} placeholder="Sẽ tự động đồng bộ" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                     <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Chủ đề case<input name="topic" type="text" value={context.topic || ''} onChange={handleContextChange} placeholder="Ví dụ: Tai nạn giao thông giờ cao điểm" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                  </div>
                  {/* Scene Section */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-inner">
                    <h3 className="text-lg font-semibold text-white">Bối cảnh (Scene)</h3>
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">Thời gian<input name="time" type="text" value={context.scene?.time || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder="Thời điểm diễn ra" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">Thời tiết<input name="weather" type="text" value={context.scene?.weather || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder="Nắng, mưa..." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Vị trí<input name="location" type="text" value={context.scene?.location || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder="Địa điểm cụ thể" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Mức độ ồn & ghi chú khác<textarea name="noise" rows="3" value={context.scene?.noise || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder="Ghi chú thêm về môi trường" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                    </div>
                  </div>
                  {/* Index Event Section */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-inner">
                    <h3 className="text-lg font-semibold text-white">Sự kiện ban đầu</h3>
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Tóm tắt sự kiện<textarea name="summary" rows="3" value={context.index_event?.summary || ''} onChange={(e) => handleNestedContextChange(e, 'index_event')} placeholder="Mô tả ngắn gọn diễn biến" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Tình trạng hiện tại<textarea name="current_state" rows="3" value={context.index_event?.current_state || ''} onChange={(e) => handleNestedContextChange(e, 'index_event')} placeholder="Điều gì đang diễn ra?" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">Ai tiếp cận đầu tiên<input name="who_first" type="text" value={context.index_event?.who_first || ''} onChange={(e) => handleNestedContextChange(e, 'index_event')} placeholder="Nhóm/cá nhân đầu tiên xử lý hiện trường" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                    </div>
                  </div>
                  {/* Background Image Generator */}
                  <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-inner space-y-5">
                    {/* Header and other elements from nhap-case.html can be added here */}
                    <h3 className="text-lg font-semibold text-white">Ảnh nền minh họa</h3>
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <p className="text-sm text-slate-400 max-w-xl">
                        Bạn có thể sinh ảnh tự động từ bối cảnh đã nhập, hoặc thêm prompt tùy chọn để mô tả chi tiết hơn.
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateBackground}
                        disabled={backgroundState.isLoading}
                        className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-transform duration-200 hover:scale-105 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-wait disabled:bg-sky-400"
                      >
                        {backgroundState.isLoading ? 'Đang xử lý...' : 'Sinh ảnh'}
                      </button>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="text-sm font-semibold text-slate-200">Prompt tùy chọn<textarea name="prompt" value={backgroundState.prompt} onChange={handleBackgroundInputChange} rows="4" placeholder="Mô tả bối cảnh..." className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                      <div className="space-y-2">
                        <span className="text-sm font-semibold text-slate-200">Tải ảnh lên</span>
                        <div 
                          className={`flex items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800/50 hover:bg-slate-700/60 ${backgroundState.isLoading ? 'animate-pulse' : ''}`}
                          onClick={() => document.getElementById('background-image-upload').click()}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleBackgroundImageUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                        >
                          <div className="flex flex-col items-center justify-center text-center">
                            <svg className="w-8 h-8 mb-2 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/></svg>
                            <p className="text-xs text-slate-400"><span className="font-semibold">Nhấn để tải lên</span> hoặc kéo thả</p>
                            <p className="text-xs text-slate-500">PNG, JPG, WEBP</p>
                          </div>
                          <input id="background-image-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleBackgroundImageUpload(e.target.files[0])} />
                        </div>
                      </div>
                    </div>
                    {(backgroundState.imageUrl || context.background_image) && ( // Ưu tiên hiển thị ảnh mới (local) hoặc ảnh đã lưu
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-slate-200 mb-2">Xem trước ảnh nền</h4>
                        <div className="relative">
                          <img src={backgroundState.imageUrl || context.background_image} alt="Xem trước ảnh nền" className="w-full max-h-60 rounded-lg object-cover border border-slate-200" />
                          <button 
                            type="button" 
                            onClick={handleDownloadImage}
                            className="absolute top-2 right-2 bg-white/80 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full shadow hover:bg-white"
                          >
                            Lưu ảnh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Notes Section */}
                  <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                    <label className="block text-sm font-semibold uppercase tracking-wide">Ràng buộc hiện trường<textarea name="constraints" rows="3" value={context.constraints || ''} onChange={handleContextChange} placeholder="Mỗi dòng là một ràng buộc" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                    <label className="block text-sm font-semibold uppercase tracking-wide">Chính sách & an toàn<textarea name="policies" rows="3" value={context.policies || ''} onChange={handleContextChange} placeholder="Mỗi dòng là một chính sách cần tuân thủ" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                    <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Đơn vị bàn giao<input name="handover" type="text" value={context.handover || ''} onChange={handleContextChange} placeholder="Ví dụ: Bàn giao cho đội cứu trợ địa phương" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                    <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Trạng thái thành công cuối cùng<textarea name="success_state" rows="3" value={context.success_state || ''} onChange={handleContextChange} placeholder="Tình trạng lý tưởng sau khi hoàn thành" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                  </div>

                  {/* Resources Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">Nguồn lực khả dụng</h3>
                      <button type="button" onClick={handleAddResource} className="inline-flex items-center gap-2 rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400">+ Thêm nhóm resource</button>
                    </div>
                    <div className="space-y-6">
                      {context.resources.map((resource, index) => (
                        <article key={index} className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-lg">
                           <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-100">Nhóm Resource #{index + 1}</h4>
                            <button type="button" onClick={() => handleRemoveResource(index)} className="text-xs font-semibold text-rose-600 transition hover:text-rose-500">Xóa</button>
                          </div>
                          <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                            <label className="block text-sm font-semibold uppercase tracking-wide">Tên nhóm<input name="label" type="text" value={resource.label || ''} onChange={(e) => handleResourceChange(e, index)} placeholder="Ví dụ: Nhân lực y tế tiền viện" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Ghi chú (tùy chọn)<input name="note" type="text" value={resource.note || ''} onChange={(e) => handleResourceChange(e, index)} placeholder="Ghi chú bổ sung cho nhóm này" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Danh sách nguồn lực<textarea name="items" rows="3" value={resource.items || ''} onChange={(e) => handleResourceChange(e, index)} placeholder="Mỗi dòng là một tài nguyên" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("skeleton")}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                    >
                      ← Về Skeleton
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("personas")}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                    >
                      Sang Personas →
                    </button>
                  </div>
                </form>
              </section>

              {/* Flow Panel */}
                <section hidden={activeTab !== "flow"} className="space-y-8">
                  <header className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">Sơ đồ luồng sự kiện (Event Flow Diagram)</h2>
                    <p className="text-sm text-slate-300">Trực quan hóa các nhánh rẽ giữa các Canon Event. Bạn có thể kéo thả các khối để sắp xếp lại.</p>
                  </header>
                  <div style={{ height: '600px' }} className="rounded-2xl border border-slate-700 bg-slate-900/50 shadow-inner">
                    <FlowDiagram skeleton={skeleton} />
                  </div>
                </section>

              {/* Personas Panel */}
              <section hidden={activeTab !== "personas"} className="space-y-8">
                <header className="space-y-1">
                  <h2 className="text-2xl font-bold text-white">
                    Personas
                  </h2>
                  <p className="text-sm text-slate-300">
                    Danh sách nhân vật và đặc điểm hành vi.
                  </p>
                </header>
                <form className="space-y-8">
                  {/* Basic Personas Fields */}
                  <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                     <label className="block text-sm font-semibold uppercase tracking-wide">Case ID<input name="case_id" type="text" value={personas.case_id || ''} onChange={handleCaseIdChange} placeholder="Sẽ tự động đồng bộ" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                     <label className="block text-sm font-semibold uppercase tracking-wide">Số lượng persona (tham khảo)<input name="count" type="number" min="0" value={personas.count || 0} onChange={(e) => setPersonas(p => ({...p, count: e.target.value}))} placeholder="Ví dụ: 3" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-white">Danh sách Persona</h3>
                      <button type="button" onClick={handleAddPersona} className="inline-flex items-center gap-2 rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400">
                        + Thêm persona
                      </button>
                    </div>
                    <div className="space-y-6">
                      {personas.personas.map((persona, index) => (
                        <article key={index} className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-lg">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-slate-100">Persona #{index + 1}</h4>
                            <button type="button" onClick={() => handleRemovePersona(index)} className="text-xs font-semibold text-rose-600 transition hover:text-rose-500">Xóa</button>
                          </div>
                          <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                            <label className="block text-sm font-semibold uppercase tracking-wide">Persona ID<input name="id" type="text" value={persona.id || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="persona_01" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Tên nhân vật<input name="name" type="text" value={persona.name || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Tên hiển thị" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Vai trò<input name="role" type="text" value={persona.role || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Vai trò trong case" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Tuổi<input name="age" type="number" value={persona.age || ''} onChange={(e) => handlePersonaChange(e, index)} min="0" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Giới tính<input name="gender" type="text" value={persona.gender || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Nam / Nữ / Khác" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Lý lịch / hoàn cảnh<textarea name="background" rows="3" value={persona.background || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Thông tin nền của nhân vật" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Tính cách<textarea name="personality" rows="3" value={persona.personality || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Đặc điểm tính cách nổi bật" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Mục tiêu<textarea name="goal" rows="3" value={persona.goal || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Điều nhân vật muốn đạt được" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Speech pattern<input name="speech_pattern" type="text" value={persona.speech_pattern || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Phong cách giao tiếp" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Emotion ban đầu<input name="emotion_init" type="text" value={persona.emotion_init || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Cảm xúc khi bắt đầu tình huống" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Emotion trong quá trình<textarea name="emotion_during" rows="3" value={persona.emotion_during || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Mỗi dòng là một mốc cảm xúc" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide">Emotion kết thúc<input name="emotion_end" type="text" value={persona.emotion_end || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Cảm xúc khi kết thúc tình huống" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">Voice tags<input name="voice_tags" type="text" value={persona.voice_tags || ''} onChange={(e) => handlePersonaChange(e, index)} placeholder="Cách nhau bởi dấu phẩy" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>

                </form>
              </section>
            </div>
          </section>
        </div>
        </main>
      </div>

      {/* Draft Modal */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-6 py-8" role="dialog" aria-modal="true">
          <div className="relative max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setDraftModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200"
              aria-label="Đóng"
            >
              &#10005;
            </button>
            <form
              onSubmit={handleSubmitDraft}
              className="space-y-5"
            >
              <header className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  Agent gợi ý case
                </span>
                <h2 className="text-xl font-semibold text-slate-900">
                  Sinh case tự động
                </h2>
                <p className="text-sm text-slate-600">
                  Mô tả chủ đề, nhân vật mong muốn hoặc các chi tiết khác để hệ
                  thống sinh ra skeleton, context và personas tương ứng.
                </p>
              </header>
              <div className="space-y-3">
                <label className="flex flex-col gap-2 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Prompt tự do
                  </span>
                  <textarea
                    name="prompt"
                    value={draftState.prompt}
                    onChange={handleDraftInputChange}
                    rows="4"
                    placeholder="Ví dụ: Tạo case về khám răng định kỳ với 3 nhân vật: bác sĩ hướng dẫn, điều dưỡng hỗ trợ và bệnh nhân cao tuổi."
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  ></textarea>
                </label>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Chủ đề (tùy chọn)
                    </span>
                    <input
                      name="topic"
                      type="text"
                      value={draftState.topic}
                      onChange={handleDraftInputChange}
                      placeholder="VD: Khám răng định kỳ tại phòng khám ABC"
                      className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Số nhân vật dự kiến
                    </span>
                    <input
                      name="personaCount"
                      type="number"
                      min="1"
                      value={draftState.personaCount}
                      onChange={handleDraftInputChange}
                      placeholder="Mặc định 3"
                      className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                  <label className="flex flex-col gap-2 text-left">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Địa điểm chính (tùy chọn)
                    </span>
                    <input
                      name="location"
                      type="text"
                      value={draftState.location}
                      onChange={handleDraftInputChange}
                      placeholder="VD: Phòng khám nha khoa Quận 3"
                      className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </label>
                </div>
              </div>
              <footer className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-500"></p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setDraftModalOpen(false)}
                    className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={draftState.isLoading}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-wait disabled:bg-emerald-400"
                  >
                    {draftState.isLoading ? "Đang sinh..." : "Sinh case"}
                  </button>
                </div>
              </footer>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

const FlowDiagram = ({ skeleton }) => { 
  const { nodes, edges } = useMemo(() => {
    const initialNodes = [];
    const initialEdges = [];
    const nodeWidth = 250;
    const nodeHeight = 150;
    const horizontalGap = 100;
    const verticalGap = 100;

    const eventIds = skeleton.canon_events.map(event => event.id).filter(Boolean);
    const lastEvent = skeleton.canon_events.length > 0 ? skeleton.canon_events[skeleton.canon_events.length - 1] : null;
    let finishNodeId = 'finish-node';
    if (lastEvent && lastEvent.id) {
      const match = lastEvent.id.match(/(\d+)$/);
      if (match) {
        const nextIdNum = parseInt(match[1], 10) + 1;
        finishNodeId = `CE${nextIdNum}`;
      }
    }

    let maxNodeY = 0;

    skeleton.canon_events.forEach((event, index) => {
      initialNodes.push({
        id: event.id || `node-${index}`,
        position: { x: (nodeWidth + horizontalGap) * (index % 3), y: (nodeHeight + verticalGap) * Math.floor(index / 3) },
        data: { label: (
          <div className="p-2 text-left">
            <div className="font-bold text-base text-white bg-primary-600 -m-2 p-2 rounded-t-lg">{event.id || `Event #${index + 1}`}</div>
            <div className="p-2">
              <div className="text-sm text-slate-200 mb-2">{event.title || '(Chưa có tiêu đề)'}</div>
              {/* Hiển thị các nhánh retry hoặc không nối được */}
              {Object.entries(event.on_score_branches || {}).map(([score, targetId]) => {
                const isRetry = parseInt(score, 10) <= 2;                
                return isRetry ? (
                  <div key={score} className="text-xs mt-1 p-1 bg-rose-500/20 rounded-md border border-rose-500/30">
                    <span className="font-bold text-rose-300">
                      🔄 Điểm {score} ➜
                    </span>{' '}
                    <span className="text-rose-400 italic">
                      {targetId || '(không có đích)'}
                    </span>
                  </div>
                ) : null
              })}
            </div>
          </div>
        )},
        style: { 
          background: '#1e293b', // slate-800,
          color: '#f1f5f9', // slate-100
          border: '1px solid #475569', // slate-600
          borderRadius: '10px',
          width: nodeWidth,
        },
      });
      
      if (initialNodes[initialNodes.length - 1].position.y > maxNodeY) {
        maxNodeY = initialNodes[initialNodes.length - 1].position.y;
      }

      if (event.on_score_branches && event.id) {
        // Nhóm các điểm số theo targetId
        const branchesByTarget = Object.entries(event.on_score_branches).reduce((acc, [rawScore, targetId]) => {
          if (targetId && eventIds.includes(targetId)) {
            const score = parseInt(rawScore, 10);
            if (!acc[targetId]) {
              acc[targetId] = { success: [], retry: [] };
            }
            if (score <= 2) {
              acc[targetId].retry.push(score);
            } else {
              acc[targetId].success.push(score);
            }
          }
          // Xử lý trường hợp event cuối cùng có nhánh pass không trỏ đi đâu
          else if (targetId && !eventIds.includes(targetId) && event.id === lastEvent?.id) {
            const score = parseInt(rawScore, 10);
            if (score > 2) { // Chỉ xét nhánh pass
              if (!acc[finishNodeId]) {
                acc[finishNodeId] = { success: [], retry: [] };
              }
              acc[finishNodeId].success.push(score);
            }
          }
          return acc;
        }, {});

        // Tạo một edge cho mỗi nhóm target
        Object.entries(branchesByTarget).forEach(([targetId, scoreGroups]) => { 
          const hasSuccessEdge = scoreGroups.success.length > 0;

          // Xử lý nhánh thành công (Success)
          if (hasSuccessEdge) {
            const sortedScores = scoreGroups.success.sort((a, b) => b - a).join(', ');
            const label = `Điểm ${sortedScores}`;
            const finalTargetId = eventIds.includes(targetId) ? targetId : finishNodeId;

            initialEdges.push({
              id: `e-${event.id}-${finalTargetId}-success`,
              source: event.id,
              target: finalTargetId,
              label: label,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#34d399', strokeWidth: 2 }, // emerald-400
              labelStyle: { fill: '#f1f5f9', fontWeight: 'bold' },
              labelBgStyle: { fill: '#1e293b', fillOpacity: 0.8, padding: '4px 6px', borderRadius: '4px' },
              markerEnd: { type: 'arrowclosed', color: '#34d399' },
            });
          }
        });
      }
    });

    // Thêm node Kết thúc
    initialNodes.push({
      id: finishNodeId,
      position: { x: nodeWidth + horizontalGap, y: maxNodeY + nodeHeight + verticalGap },
      data: { 
        label: (
          <div className="p-4 text-center">
            <div className="font-bold text-lg text-white">{finishNodeId}</div>
            <div className="text-base font-bold text-slate-200">Kết thúc</div>
          </div>
        )
      },
      style: {
        background: '#0f172a', // slate-900
        color: '#f1f5f9',
        border: '2px dashed #475569', // slate-600
        borderRadius: '50%',
        width: 120,
        height: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
    });

    return { nodes: initialNodes, edges: initialEdges };
  }, [skeleton]);

  return (
    <ReactFlow nodes={nodes} edges={edges} fitView>
      <Background color="#475569" gap={16} />
      <Controls />
      <MiniMap nodeColor={n => n.style?.background || '#1e293b'} />
    </ReactFlow>
  );
};
