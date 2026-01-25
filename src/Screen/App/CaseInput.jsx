import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import Footer from "../../components/Footer";
import { backgroundImage2 } from "../../Image/image";
import { storage, firestore } from "../../config/firebase"; // Import firestore
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
  const { t } = useTranslation();
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

  const newCanonEvent = () => ({
    id: t('case_input.skeleton.default_event_id'),
    title: t('case_input.skeleton.default_event_title'),
    description: "",
    npc_appearance: "",
    timeout_turn: 0,
    success_criteria: [newSuccessCriterion()],
    on_score_branches: SUCCESS_LEVEL_SCORES.reduce((acc, score) => ({ ...acc, [score]: "" }), {}),
    on_success: "",
    on_fail: ""
  });

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
  const handlePersonaItemChange = (e, index) => {
    const { name, value } = e.target;
    setPersonas(prev => {
      const newPersonas = [...prev.personas];
      newPersonas[index] = { ...newPersonas[index], [name]: value };
      return { ...prev, personas: newPersonas };
    });
  };

  const handlePersonasChange = (e) => {
    const { name, value } = e.target;
    setPersonas(prev => ({ ...prev, [name]: value }));
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
          toast.success(t('case_input.alerts.upload_success', { name: file.name }));
        } catch (error) {
          toast.error(t('case_input.alerts.invalid_json'));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSaveCase = async () => {
    let caseId = skeleton.case_id || context.case_id || personas.case_id;
    if (!caseId) {
      toast.error(t('case_input.alerts.enter_id'));
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
        toast.error(t('case_input.alerts.image_upload_error', { error: error.message }));
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
        throw new Error(result.message || t('case_input.alerts.server_error'));
      }

      toast.success(result.message || t('case_input.alerts.save_success', { id: caseId }));
      setTimeout(() => {
        window.location.reload();
      }, 1500); // Đợi 1.5 giây trước khi tải lại trang

    } catch (error) {
      console.error("Error saving case:", error);
      toast.error(t('case_input.alerts.save_error', { error: error.message }));
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

    toast.success(t('case_input.alerts.export_success', { name: fileName }));
  };

  const handleClearData = (type) => {
    // This is a placeholder. You can implement logic to reset the state.
    toast.info(t('case_input.alerts.clear_not_implemented', { type }));
  };

  const handleDraftInputChange = (e) => {
    const { name, value } = e.target;
    setDraftState(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitDraft = async (e) => {
    e.preventDefault();
    if (!draftState.prompt.trim()) {
      toast.error(t('case_input.alerts.enter_prompt'));
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
        throw new Error(errorText || t('case_input.alerts.draft_generation_error'));
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

      toast.success(t('case_input.alerts.draft_success', { id: draftData.case_id }));

      // Show warnings if any
      if (draftData.warnings && draftData.warnings.length > 0) {
        setTimeout(() => {
          toast.info(t('case_input.alerts.system_note') + "\n- " + draftData.warnings.join("\n- "));
        }, 100);
      }

      setDraftModalOpen(false); // Close modal on success
    } catch (error) {
      console.error("Error generating draft case:", error);
      toast.error(t('case_input.alerts.draft_error', { error: error.message }));
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
      toast.error(t('case_input.alerts.invalid_image'));
    }
  };

  const handleDownloadImage = () => {
    // Ưu tiên ảnh mới chưa lưu (local URL) hoặc ảnh đã lưu trên context
    const url = backgroundState.imageUrl || context.background_image;
    if (!url) {
      toast.info(t('case_input.alerts.no_image'));
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
      toast.error(t('case_input.alerts.enter_id_for_image'));
      return;
    }

    setBackgroundState(prev => ({ ...prev, isLoading: true }));

    // Tự động tạo prompt từ context
    const contextDescriptionParts = [];
    if (context.scene?.location) contextDescriptionParts.push(t('case_input.context.prompt_location', { location: context.scene.location }));
    if (context.scene?.time) contextDescriptionParts.push(t('case_input.context.prompt_time', { time: context.scene.time }));
    if (context.scene?.weather) contextDescriptionParts.push(t('case_input.context.prompt_weather', { weather: context.scene.weather }));
    if (context.index_event?.summary) contextDescriptionParts.push(t('case_input.context.prompt_main_event', { summary: context.index_event.summary }));
    if (context.index_event?.current_state) contextDescriptionParts.push(t('case_input.context.prompt_current_state', { state: context.index_event.current_state }));

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
        throw new Error(errorText || t('case_input.alerts.background_generation_error'));
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
      toast.success(t('case_input.alerts.background_generate_success'));

    } catch (error) {
      console.error("Error generating background image:", error);
      toast.error(t('user.error') + `: ${error.message}`);
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
                  {t('case_input.auto_generate_button')}
                </span>
                <h1 className="text-3xl font-bold text-white drop-shadow-md">
                  {t('case_input.title')}
                </h1>
                <p className="max-w-2xl text-sm text-slate-300">
                  {t('case_input.description')}
                </p>
              </div>
              <div className="mt-6 flex flex-col items-center gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setDraftModalOpen(true)}
                  disabled={draftState.isLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:bg-emerald-500 active:scale-95 disabled:cursor-wait disabled:opacity-50"
                >
                  {draftState.isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      {t('case_input.draft_modal.generating')}
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      {t('case_input.draft_modal.generate')}
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-400">
                  {t('case_input.auto_generate_desc')}
                </p>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {["skeleton", "context", "personas"].map((type) => (
                  <div
                    key={type}
                    className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-800/40 p-6 text-center shadow-lg shadow-slate-900/20 transition-all duration-300 focus-within:border-primary-500/70 focus-within:shadow-primary-500/10 hover:-translate-y-1 hover:border-primary-500/70 hover:bg-slate-800/80"
                    tabIndex="0"
                    role="button"
                    aria-label={t('case_input.upload_json_label', { type: type.charAt(0).toUpperCase() + type.slice(1) })}
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
                      {t('case_input.upload_json_label', { type: type })}
                    </p>
                    <p className="max-w-[16rem] text-xs text-slate-400">
                      {t('case_input.upload_hint')}
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
                        {t('case_input.upload_button')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleExportJson(type); }}
                        className="rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-1.5 text-xs font-semibold text-primary-300 transition-transform duration-200 hover:scale-105 hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400"
                      >
                        {t('case_input.save_json')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleClearData(type); }}
                        className="rounded-full border border-slate-600 px-4 py-1.5 text-xs font-semibold text-slate-400 transition-transform duration-200 hover:scale-105 hover:border-slate-500 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-500"
                      >
                        {t('case_input.clear')}
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
                      className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-200 ${activeTab === tab
                        ? "border-transparent bg-primary-600 text-white shadow-lg shadow-primary-500/30 hover:bg-primary-500"
                        : "border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-700/70 hover:text-white"
                        }`}
                    >
                      {t(`case_input.tabs.${tab}`)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSaveCase}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-transform duration-200 hover:scale-105 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:bg-emerald-400 disabled:opacity-60"
                >
                  {t('case_input.save_all')}
                </button>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-800/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/20">
                {/* Skeleton Panel */}
                <section hidden={activeTab !== "skeleton"} className="space-y-8">
                  <header className="space-y-1"><h2 className="text-2xl font-bold text-white">{t('case_input.skeleton.title')}</h2><p className="text-sm text-slate-300">{t('case_input.skeleton.desc')}</p></header>
                  <form className="space-y-8">
                    {/* Basic Skeleton Fields */}
                    <div className="grid gap-6 md:grid-cols-2" data-basic-fields="skeleton">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                        {t('case_input.skeleton.case_id')}
                        <input type="text" name="case_id" value={skeleton.case_id || ''} onChange={handleCaseIdChange} placeholder={t('case_input.skeleton.case_id_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                      </label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                        {t('case_input.skeleton.case_name')}
                        <input type="text" name="title" value={skeleton.title || ''} onChange={handleSkeletonChange} placeholder={t('case_input.skeleton.case_name_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                      </label>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">
                          {t('case_input.skeleton.canon_events')}
                        </h3>
                        <button type="button" onClick={handleAddEvent} className="inline-flex items-center gap-2 rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400">
                          {t('case_input.skeleton.add_event')}
                        </button>
                      </div>
                      {/* Canon Events List */}
                      <div className="space-y-6">
                        {skeleton.canon_events.map((event, eventIndex) => (
                          <article key={eventIndex} className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-100">{t('case_input.skeleton.event_number', { number: eventIndex + 1 })}</h4>
                              <button type="button" onClick={() => handleRemoveEvent(eventIndex)} className="text-xs font-semibold text-rose-600 transition hover:text-rose-500">{t('case_input.clear')}</button>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2">
                              <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.event_code')}<input name="id" value={event.id || ''} onChange={(e) => handleEventChange(e, eventIndex)} type="text" placeholder={t('case_input.skeleton.event_code_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.event_title')}<input name="title" value={event.title || ''} onChange={(e) => handleEventChange(e, eventIndex)} type="text" placeholder={t('case_input.skeleton.event_title_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.skeleton.event_desc')}<textarea name="description" value={event.description || ''} onChange={(e) => handleEventChange(e, eventIndex)} rows="3" placeholder={t('case_input.skeleton.event_desc_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.skeleton.npc_appearance')}<textarea name="npc_appearance" value={event.npc_appearance || ''} onChange={(e) => handleEventChange(e, eventIndex)} rows="3" placeholder={t('case_input.skeleton.npc_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.timeout')}<input name="timeout_turn" value={event.timeout_turn || 0} onChange={(e) => handleEventChange(e, eventIndex)} type="number" min="0" className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                            </div>

                            {/* Success Criteria Section */}
                            <div className="mt-4 space-y-3">
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.success_criteria')}</span>
                                <button type="button" onClick={() => handleAddSuccessCriterion(eventIndex)} className="text-xs font-semibold text-primary-600 transition hover:text-primary-500 focus:outline-none">{t('case_input.skeleton.add_criterion')}</button>
                              </div>
                              <p className="text-xs text-slate-400">{t('case_input.skeleton.criterion_desc')}</p>
                              <div className="space-y-4">
                                {Array.isArray(event.success_criteria) && event.success_criteria.map((criterion, critIndex) => (
                                  <div key={critIndex} className="rounded-2xl border border-slate-700 bg-slate-800/50 p-4 shadow-inner space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                      <span className="text-sm font-semibold text-slate-200">{t('case_input.skeleton.criterion_label')}</span>
                                      <button type="button" onClick={() => handleRemoveSuccessCriterion(eventIndex, critIndex)} className="text-xs font-semibold text-slate-400 transition hover:text-rose-500 focus:outline-none">{t('case_input.clear')}</button>
                                    </div>
                                    <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">
                                      {t('case_input.skeleton.event_desc')}
                                      <input type="text" name="description" value={criterion?.description || ''} onChange={(e) => handleSuccessCriterionChange(e, eventIndex, critIndex)} placeholder={t('case_input.skeleton.criterion_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
                                    </label>
                                    <div className="grid gap-3 md:grid-cols-2">
                                      <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.levels.level5')}<textarea rows="2" value={criterion?.levels?.[5] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 5)} placeholder={t('case_input.skeleton.levels.level5_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                      <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.levels.level4')}<textarea rows="2" value={criterion?.levels?.[4] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 4)} placeholder={t('case_input.skeleton.levels.level4_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                      <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.levels.level3')}<textarea rows="2" value={criterion?.levels?.[3] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 3)} placeholder={t('case_input.skeleton.levels.level3_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                      <label className="text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.levels.level2')}<textarea rows="2" value={criterion?.levels?.[2] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 2)} placeholder={t('case_input.skeleton.levels.level2_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                      <label className="text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.skeleton.levels.level1')}<textarea rows="2" value={criterion?.levels?.[1] || ''} onChange={(e) => handleLevelDescriptorChange(e, eventIndex, critIndex, 1)} placeholder={t('case_input.skeleton.levels.level1_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Outcome Branching Section */}
                            <div className="mt-4 space-y-3">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <span className="text-sm font-semibold uppercase tracking-wide text-primary-400">{t('case_input.skeleton.branching')}</span>
                                  <p className="text-xs text-slate-400">{t('case_input.skeleton.branching_desc')}</p>
                                </div>
                                <button type="button" onClick={() => handleResetBranches(eventIndex)} className="text-xs font-semibold text-primary-600 transition hover:text-primary-500 focus:outline-none">{t('case_input.skeleton.reset_branches')}</button>
                              </div>
                              <div className="space-y-2">
                                {SUCCESS_LEVEL_SCORES.map((score) => (
                                  <label key={score} className="block space-y-1 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.score_label', { score: score })}</span>
                                    <input type="text" value={event.on_score_branches?.[score] || ''} onChange={(e) => handleBranchChange(e, eventIndex, score)} placeholder={t('case_input.skeleton.score_placeholder', { score: score })} className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" />
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
                        {t('case_input.skeleton.next_tab')}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Context Panel */}
                <section hidden={activeTab !== "context"} className="space-y-8">
                  <header className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">
                      {t('case_input.context.title')}
                    </h2>
                    <p className="text-sm text-slate-300">
                      {t('case_input.context.desc')}
                    </p>
                  </header>
                  <form className="space-y-8">
                    {/* Basic Context Fields */}
                    <div className="grid gap-6 md:grid-cols-2">
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.skeleton.case_id')}<input name="case_id" type="text" value={context.case_id || ''} onChange={handleCaseIdChange} placeholder={t('case_input.context.case_id_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.context.topic')}<input name="topic" type="text" value={context.topic || ''} onChange={handleContextChange} placeholder={t('case_input.context.topic_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                    </div>
                    {/* Scene Section */}
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-inner">
                      <h3 className="text-lg font-semibold text-white">{t('case_input.context.scene_title')}</h3>
                      <div className="mt-4 grid gap-6 md:grid-cols-2">
                        <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.context.time')}<input name="time" type="text" value={context.scene?.time || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder={t('case_input.context.time_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.context.weather')}<input name="weather" type="text" value={context.scene?.weather || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder={t('case_input.context.weather_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.context.location')}<input name="location" type="text" value={context.scene?.location || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder={t('case_input.context.location_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.context.noise')}<textarea name="noise" rows="3" value={context.scene?.noise || ''} onChange={(e) => handleNestedContextChange(e, 'scene')} placeholder={t('case_input.context.noise_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                      </div>
                    </div>
                    {/* Index Event Section */}
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-inner">
                      <h3 className="text-lg font-semibold text-white">{t('case_input.context.initial_event')}</h3>
                      <div className="mt-4 grid gap-6 md:grid-cols-2">
                        <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.context.summary')}<textarea name="summary" rows="3" value={context.index_event?.summary || ''} onChange={(e) => handleNestedContextChange(e, 'index_event')} placeholder={t('case_input.context.summary_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.context.current_state')}<textarea name="current_state" rows="3" value={context.index_event?.current_state || ''} onChange={(e) => handleNestedContextChange(e, 'index_event')} placeholder={t('case_input.context.current_state_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                        <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300 md:col-span-2">{t('case_input.context.who_first')}<input name="who_first" type="text" value={context.index_event?.who_first || ''} onChange={(e) => handleNestedContextChange(e, 'index_event')} placeholder={t('case_input.context.who_first_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                      </div>
                    </div>
                    {/* Background Image Generator */}
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-inner space-y-5">
                      {/* Header and other elements from nhap-case.html can be added here */}
                      <h3 className="text-lg font-semibold text-white">{t('case_input.context.background_image')}</h3>
                      <div className="flex flex-wrap items-end justify-between gap-4">
                        <p className="text-sm text-slate-400 max-w-xl">
                          {t('case_input.context.image_desc')}
                        </p>
                        <button
                          type="button"
                          onClick={handleGenerateBackground}
                          disabled={backgroundState.isLoading}
                          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition-transform duration-200 hover:scale-105 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:cursor-wait disabled:bg-sky-400"
                        >
                          {backgroundState.isLoading ? t('case_input.context.processing') : t('case_input.context.generate_image')}
                        </button>
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-200">{t('case_input.context.optional_prompt')}<textarea name="prompt" value={backgroundState.prompt} onChange={handleBackgroundInputChange} rows="4" placeholder={t('case_input.context.optional_prompt_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                        <div className="space-y-2">
                          <span className="text-sm font-semibold text-slate-200">{t('case_input.context.upload_image')}</span>
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
                              <svg className="w-8 h-8 mb-2 text-slate-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" /></svg>
                              <p className="text-xs text-slate-400"><span className="font-semibold">{t('case_input.context.upload_hint')}</span></p>
                              <p className="text-xs text-slate-500">PNG, JPG, WEBP</p>
                            </div>
                            <input id="background-image-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleBackgroundImageUpload(e.target.files[0])} />
                          </div>
                        </div>
                      </div>
                      {(backgroundState.imageUrl || context.background_image) && ( // Ưu tiên hiển thị ảnh mới (local) hoặc ảnh đã lưu
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold text-slate-200 mb-2">{t('case_input.context.preview_image')}</h4>
                          <div className="relative">
                            <img src={backgroundState.imageUrl || context.background_image} alt={t('case_input.context.preview_image_alt')} className="w-full max-h-60 rounded-lg object-cover border border-slate-200" />
                            <button
                              type="button"
                              onClick={handleDownloadImage}
                              className="absolute top-2 right-2 bg-white/80 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full shadow hover:bg-white"
                            >
                              {t('case_input.context.save_image')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Notes Section */}
                    <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                      <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.context.constraints')}<textarea name="constraints" rows="3" value={context.constraints || ''} onChange={handleContextChange} placeholder={t('case_input.context.constraints_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.context.policies')}<textarea name="policies" rows="3" value={context.policies || ''} onChange={handleContextChange} placeholder={t('case_input.context.policies_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">{t('case_input.context.handover')}<input name="handover" type="text" value={context.handover || ''} onChange={handleContextChange} placeholder={t('case_input.context.handover_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">{t('case_input.context.success_state')}<textarea name="success_state" rows="3" value={context.success_state || ''} onChange={handleContextChange} placeholder={t('case_input.context.success_state_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                    </div>

                    {/* Resources Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">{t('case_input.context.resources_title')}</h3>
                        <button type="button" onClick={handleAddResource} className="inline-flex items-center gap-2 rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400">{t('case_input.context.add_resource')}</button>
                      </div>
                      <div className="space-y-6">
                        {context.resources.map((resource, index) => (
                          <article key={index} className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-100">{t('case_input.context.resource_group', { number: index + 1 })}</h4>
                              <button type="button" onClick={() => handleRemoveResource(index)} className="text-xs font-semibold text-rose-600 transition hover:text-rose-500">{t('case_input.clear')}</button>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.context.resource_name')}<input name="label" type="text" value={resource.label || ''} onChange={(e) => handleResourceChange(e, index)} placeholder={t('case_input.context.resource_name_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.context.resource_note')}<input name="note" type="text" value={resource.note || ''} onChange={(e) => handleResourceChange(e, index)} placeholder={t('case_input.context.resource_note_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">{t('case_input.context.resource_items')}<textarea name="items" rows="3" value={resource.items || ''} onChange={(e) => handleResourceChange(e, index)} placeholder={t('case_input.context.resource_items_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
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
                        ← {t('case_input.context.back_to_skeleton')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("personas")}
                        className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                      >
                        {t('case_input.context.next_to_personas')}
                      </button>
                    </div>
                  </form>
                </section>

                {/* Flow Panel */}
                <section hidden={activeTab !== "flow"} className="space-y-8">
                  <header className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">{t('case_input.flow.title')}</h2>
                    <p className="text-sm text-slate-300">{t('case_input.flow.desc')}</p>
                  </header>
                  <div style={{ height: '600px' }} className="rounded-2xl border border-slate-700 bg-slate-900/50 shadow-inner overflow-hidden">
                    {activeTab === "flow" && <FlowDiagram skeleton={skeleton} />}
                  </div>
                </section>

                {/* Personas Panel */}
                <section hidden={activeTab !== "personas"} className="space-y-8">
                  <header className="space-y-1">
                    <h2 className="text-2xl font-bold text-white">
                      {t('case_input.personas.title')}
                    </h2>
                    <p className="text-sm text-slate-300">
                      {t('case_input.personas.desc')}
                    </p>
                  </header>
                  <form className="space-y-8">
                    {/* Basic Personas Fields */}
                    <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                      <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.skeleton.case_id')}<input name="case_id" type="text" value={personas.case_id || ''} onChange={handleCaseIdChange} placeholder={t('case_input.context.case_id_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                      <label className="block text-sm font-semibold uppercase tracking-wide text-slate-300">{t('case_input.personas.persona_count')}<input name="count" type="number" min="0" value={personas.count || 0} onChange={handlePersonasChange} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-white">{t('case_input.personas.list_title')}</h3>
                        <button type="button" onClick={handleAddPersona} className="inline-flex items-center gap-2 rounded-full border border-primary-500/50 bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-300 transition hover:bg-primary-500/20 focus:outline-none focus:ring-2 focus:ring-primary-400">
                          {t('case_input.personas.add_persona')}
                        </button>
                      </div>
                      <div className="space-y-6">
                        {personas.personas.map((persona, index) => (
                          <article key={index} className="space-y-6 rounded-2xl border border-slate-700 bg-slate-900/30 p-6 shadow-lg">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-semibold text-slate-100">{t('case_input.personas.persona_number', { number: index + 1 })}</h4>
                              <button type="button" onClick={() => handleRemovePersona(index)} className="text-xs font-semibold text-rose-600 transition hover:text-rose-500">{t('case_input.clear')}</button>
                            </div>
                            <div className="grid gap-6 md:grid-cols-2 text-slate-300">
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.persona_id')}<input name="persona_id" type="text" value={persona.persona_id || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.persona_id_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.name')}<input name="name" type="text" value={persona.name || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.name_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.role')}<input name="role" type="text" value={persona.role || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.role_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <div className="grid grid-cols-2 gap-4">
                                <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.age')}<input name="age" type="text" value={persona.age || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.age_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                                <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.gender')}<input name="gender" type="text" value={persona.gender || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.gender_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              </div>
                              <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">{t('case_input.personas.background')}<textarea name="background" rows="3" value={persona.background || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.background_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">{t('case_input.personas.personality')}<textarea name="personality" rows="3" value={persona.personality || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.personality_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">{t('case_input.personas.goal')}<textarea name="goal" rows="3" value={persona.goal || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.goal_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide md:col-span-2">{t('case_input.personas.speech_pattern')}<textarea name="speech_pattern" rows="2" value={persona.speech_pattern || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.speech_pattern_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50"></textarea></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.emotion_init')}<input name="emotion_init" type="text" value={persona.emotion_init || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.emotion_init_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.emotion_during')}<input name="emotion_during" type="text" value={persona.emotion_during || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.emotion_during_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.emotion_end')}<input name="emotion_end" type="text" value={persona.emotion_end || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.emotion_end_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
                              <label className="block text-sm font-semibold uppercase tracking-wide">{t('case_input.personas.voice_tags')}<input name="voice_tags" type="text" value={persona.voice_tags || ''} onChange={(e) => handlePersonaItemChange(e, index)} placeholder={t('case_input.personas.voice_tags_placeholder')} className="mt-2 w-full rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-400 focus:border-primary-500 focus:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/50" /></label>
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

      {/* Draft Modal - Professional Redesign */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true">
          {/* Backdrop with enhanced blur */}
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setDraftModalOpen(false)}
          />

          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-[2.5rem] border border-emerald-500/20 bg-slate-900 shadow-2xl shadow-emerald-500/10 transition-all duration-300">
            {/* Header with Decorative Light Effect */}
            <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl opacity-50" />
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl opacity-50" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setDraftModalOpen(false)}
              className="absolute right-6 top-6 z-10 rounded-full bg-slate-800/50 p-2 text-slate-400 backdrop-blur-sm transition-all hover:bg-slate-700 hover:text-white group"
              aria-label="Đóng"
            >
              <svg className="h-5 w-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <form onSubmit={handleSubmitDraft} className="relative z-10 flex flex-col p-8 sm:p-10">
              {/* Header Content */}
              <div className="mb-10 flex flex-col items-center gap-3 text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                  </span>
                  {t('case_input.draft_modal.agent_hint')}
                </span>
                <h2 className="bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-4xl">
                  {t('case_input.draft_modal.title')}
                </h2>
                <p className="max-w-md text-sm font-medium leading-relaxed text-slate-400">
                  {t('case_input.draft_modal.desc')}
                </p>
              </div>

              {/* Form Body */}
              <div className="space-y-6">
                {/* Main Prompt Area */}
                <div className="group relative space-y-2">
                  <label htmlFor="prompt" className="flex items-center gap-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors group-focus-within:text-emerald-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    {t('case_input.draft_modal.free_prompt')} <span className="text-emerald-500">*</span>
                  </label>
                  <textarea
                    id="prompt"
                    name="prompt"
                    required
                    value={draftState.prompt}
                    onChange={handleDraftInputChange}
                    placeholder={t('case_input.draft_modal.free_prompt_placeholder')}
                    className="block w-full min-h-[120px] rounded-3xl border-0 bg-slate-800/50 px-5 py-4 text-sm text-slate-100 shadow-inner ring-1 ring-inset ring-slate-700/50 transition-all duration-300 placeholder:text-slate-600 focus:bg-slate-800/80 focus:ring-2 focus:ring-inset focus:ring-emerald-500/50 focus:outline-none"
                  />
                </div>

                {/* Optional Grid */}
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="group space-y-2">
                    <label className="flex items-center gap-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors group-focus-within:text-emerald-400">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      {t('case_input.draft_modal.topic_opt')}
                    </label>
                    <input
                      name="topic"
                      type="text"
                      value={draftState.topic}
                      onChange={handleDraftInputChange}
                      placeholder={t('case_input.draft_modal.topic_placeholder')}
                      className="block w-full rounded-2xl border-0 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 shadow-inner ring-1 ring-inset ring-slate-700/50 transition-all duration-300 placeholder:text-slate-600 focus:bg-slate-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="group space-y-2">
                    <label className="flex items-center gap-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors group-focus-within:text-emerald-400">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                      {t('case_input.draft_modal.persona_count')}
                    </label>
                    <input
                      name="personaCount"
                      type="number"
                      min="1"
                      value={draftState.personaCount}
                      onChange={handleDraftInputChange}
                      placeholder={t('case_input.draft_modal.persona_count_placeholder')}
                      className="block w-full rounded-2xl border-0 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 shadow-inner ring-1 ring-inset ring-slate-700/50 transition-all duration-300 placeholder:text-slate-600 focus:bg-slate-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="group space-y-2">
                    <label className="flex items-center gap-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500 transition-colors group-focus-within:text-emerald-400">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {t('case_input.draft_modal.location_opt')}
                    </label>
                    <input
                      name="location"
                      type="text"
                      value={draftState.location}
                      onChange={handleDraftInputChange}
                      placeholder={t('case_input.draft_modal.location_placeholder')}
                      className="block w-full rounded-2xl border-0 bg-slate-800/50 px-4 py-3 text-sm text-slate-200 shadow-inner ring-1 ring-inset ring-slate-700/50 transition-all duration-300 placeholder:text-slate-600 focus:bg-slate-800 focus:ring-2 focus:ring-inset focus:ring-emerald-500/40 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 ml-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                      {t('case_input.draft_modal.output_language')}
                    </label>
                    <div className="flex h-[44px] items-stretch gap-1 rounded-[1.25rem] bg-slate-800/50 p-1 ring-1 ring-inset ring-slate-700/50">
                      {[
                        { id: 'vi', label: t('case_input.draft_modal.lang_vi') },
                        { id: 'en', label: t('case_input.draft_modal.lang_en') }
                      ].map((lang) => (
                        <label
                          key={lang.id}
                          className={`relative flex flex-1 cursor-pointer items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 ${draftState.language === lang.id
                            ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                            }`}
                        >
                          <input
                            type="radio"
                            name="language"
                            value={lang.id}
                            checked={draftState.language === lang.id}
                            onChange={handleDraftInputChange}
                            className="sr-only"
                          />
                          {lang.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer with Glowing Generate Button */}
              <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-slate-700/50 pt-8">
                <p className="text-[10px] font-medium text-slate-500 italic max-w-[200px]">
                  * Dữ liệu sinh ra sẽ được tự động điền vào biểu mẫu để bạn kiểm tra.
                </p>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setDraftModalOpen(false)}
                    className="rounded-2xl px-6 py-3 text-sm font-bold text-slate-400 transition-colors duration-200 hover:text-slate-100 focus:outline-none"
                  >
                    {t('case_input.draft_modal.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={draftState.isLoading}
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-[1.5rem] bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-50"
                  >
                    {draftState.isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                        <span>{t('case_input.draft_modal.generating')}</span>
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 transition-transform group-hover:scale-125" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{t('case_input.draft_modal.generate')}</span>
                      </>
                    )}
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
        data: {
          label: (
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
          )
        },
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
