import React, {createRef, useState} from "react";
import cookie from "react-cookies";
import {
    Alert,
    Button,
    Carousel,
    Col,
    Dropdown,
    Empty,
    Icon,
    Menu,
    message,
    Popconfirm,
    Progress,
    Row,
    Spin,
    Tooltip,
} from 'antd';

import {
    BuildOutlined,
    ClockCircleOutlined,
    CloudSyncOutlined,
    DeleteFilled,
    EditOutlined,
    ExclamationCircleOutlined,
    ExclamationCircleTwoTone,
    ExportOutlined,
    FileDoneOutlined,
    FileExclamationTwoTone,
    FolderOutlined,
    HourglassOutlined,
    InfoCircleOutlined,
    LeftOutlined,
    LoadingOutlined,
    PlayCircleOutlined,
    RightOutlined,
    SolutionOutlined,
    StarFilled,
    UploadOutlined,
    UsergroupAddOutlined
} from '@ant-design/icons';
import {
    cancelExport,
    prioritizeExport,
    requestSlideRetrieval,
    startExport,
    startTiling
} from '../../redux_actions/slides.action'
import EditableTagGroup from '../viewer/viewer.tags';
import {
    getBarcodeUrl,
    getPreviewUrl,
    getRealRemoteURL,
    isCloud,
    isRunningFromSite,
    isSuperuser,
    isTrue,
    notNull,
    openEndPoint, slideStatusCategory
} from '../../utils/utils';
import {
    ArchiveConstants,
    defaultBarcode,
    defaultPreview,
    objectiveType,
    slideExportStatus, slideStatusEnum,
    slideUploadStatus,
    slideViewType
} from '../../utils/const';
import {FaCircle} from "react-icons/all";
import {getSlideArchivalDate, patchSlide} from "../../utils/slide_utils";
import {Stack} from "@mui/material";
import Typography from "@mui/material/Typography";
import {ErrorTwoTone} from "@mui/icons-material";
import CircularProgressWithLabel from "../gammaviewer/components/CircularProgressWithLabel";
import {addSlidesToShare} from "../../redux_actions/shareManager.action";
import {getCaseNamePlaceholder} from "utils/org_utils";
import {aclPermissions, hasPermissions} from "const/ACLPermissions";
import { tileViewApp } from "component/gammaviewer/app_maker";
import { getLastArchivedDate } from "../../utils/archival_utils";
import {store} from "../../helper/store";

const iconFontSize = "15px";

const unitToShortMap = {
    "MILLISECONDS": "ms",
    "SECONDS": "sec",
    "MINUTES": "min",
    "MICRONS": "um",
    "MILLIMETERS": "mm",
};

export const shortenUnit = (unit) => {
    return (unit in unitToShortMap) ? unitToShortMap[unit] : '';
}

export const getUnreachableComponent = (slide) =>
    <Stack direction={"column"} alignItems={"center"} justifyContent={"center"} sx={{height: "100%"}}>
        <ErrorTwoTone sx={{fontSize: "50px", color: "#ff6666"}}/>
        <Typography variant={"subtitle2"} color={"#ff0000"}>
            {slide.device_ip} is unreachable
        </Typography>
    </Stack>

export const getPreviewComponent = (slide, is_cloud, isMobile) => {
    let previewPath = slide.preview_image;

    if (is_cloud) {
        let parts = previewPath.split("/");
        if (parts.length >= 2) {
            previewPath = `${parts[parts.length-2]}/${parts[parts.length-1]}`;
        }
        let slide_path = slide.path;
        if (slide_path.endsWith("_mdir/")) {
            slide_path = slide_path.replace("_mdir/", "");
        }
        previewPath = `${slide.cloud_url}/${slide_path}${previewPath}`;
    }

    if (is_cloud === false) {
        previewPath = previewPath.replace("/static/", "");
        previewPath = getPreviewUrl(previewPath.replace('stitched_small_viewer', 'selection_marked'), slide);
    }
    return <img
        width={isMobile ? 100 : 200}
        height={isMobile ? 48 : 96}
        alt="logo"
        src={previewPath}
        onError={({event, currentTarget}) => {
            currentTarget.src = defaultPreview;
            if (notNull(event?.currentTarget?.onerror)) {
                event.currentTarget.onerror = null; // prevents looping
            }
        }}
    />
}

export const getLabelComponent = (slide, is_cloud, isMobile, rotate) => {
    // FEATURE: Barcode Permission Control
    // Hide barcode image if user doesn't have barcode_app permission
    if (!hasPermissions([aclPermissions.barcode_app])) {
        return null;
    }
    // END FEATURE
    
    const labelPath = getBarcodeUrl(slide, is_cloud);

    return <img
        style={{borderWidth: "2px", borderColor: "red"}}
        height={isMobile ? 54 : 108}
        width={isMobile ? 48 : 96}
        alt="barcode-does-not-exist"
        src={labelPath}
        onError={({event, currentTarget}) => {
            currentTarget.src = defaultBarcode;
            if (notNull(event?.currentTarget?.onerror)) {
                event.currentTarget.onerror = null; // prevents looping
            }
        }}
        className={rotate ? "rotate270" : ""}
    />
}

export const LabelComponentWithRotation = ({slide, is_cloud, isMobile}) => {

    let [rotationAngle, setRotationAngle] = useState(270);

    const labelPath = getBarcodeUrl(slide, is_cloud);
    return <Tooltip placement="rightTop" title={"Rotate Barcode"}>

        <div className="barcode-filled" onClick={() => {
            setRotationAngle((rotationAngle + 90) % 360);
        }}>
            <img key={Math.random()} className="barcode-image"
                 src={labelPath}
                 alt={"Barcode"}
                 style={{transform: 'rotate(' + rotationAngle + 'deg)'}}/>

            <div className="rotate"><Icon type="reload"/></div>
        </div>
    </Tooltip>
}

export const getAssignCaseComponent = (slide, handleAssignCase) => {
    if (!hasPermissions([aclPermissions.update_slides_name]) &&
        !hasPermissions([aclPermissions.update_slides_in_case])) {
        return null
    }

    return (
        <Tooltip placement="bottomRight" title={`Edit ${getCaseNamePlaceholder()} / Slide ID`}>
            <EditOutlined
                width={"28px"}
                fill="current"
                stroke="current"
                strokeWidth={"16px"}
                onClick={(event) => {
                    event.stopPropagation();
                    handleAssignCase(slide, !slide.barcode_failed);
                }}
                className="icon-hover slide-icons"/>
        </Tooltip>
    );
}

export const getSlideReadStatusComponent = (slide, handleSlideReadStatus) => {
    if (!isTrue((cookie.load("organisation_setting") || {})["make_slide_read_config"]) || !hasPermissions([aclPermissions.share_slide])) {
        return null
    }
    return (
        <Tooltip placement="bottomRight" title={`Slide Read Info`}>
            <InfoCircleOutlined
                width={"28px"}
                fill="current"
                stroke="current"
                strokeWidth={"16px"}
                onClick={(event) => {
                    event.stopPropagation();
                    handleSlideReadStatus(slide);
                }}
                className="icon-hover slide-icons"/>
        </Tooltip>
    )
}

export const getAssignCaseButtonComponent = (slide, handleAssignCase) => {
    if (!hasPermissions([aclPermissions.update_slides_in_case])) return null;
    return (
        <Button
            className="lighter-danger-button"
            type="danger"
            size='small'
            onClick={(event) => {
                event.stopPropagation();
                handleAssignCase(slide, !slide.barcode_failed);
            }}
            ghost
        >
            <ExclamationCircleOutlined style={{color: 'red', fontSize: '15px'}}/>
            Add to {getCaseNamePlaceholder()}
        </Button>
    );
}

export const getAssignCaseButtonComponent2 = (slide, handleAssignCase, set) => {
    return (
        <Button
            className="lighter-danger-button"
            type="danger"
            size='small'
            style={!set ? {visibility: "hidden"} : {visibility: "visible"}}
            onClick={(event) => {
                event.stopPropagation();
                handleAssignCase(slide, !slide.barcode_failed);
            }}
            ghost
        >
            <ExclamationCircleOutlined style={{color: 'red', fontSize: '15px'}}/>
            Add to {getCaseNamePlaceholder()}
        </Button>
    );
}

export const stitchingPercentComponent = (slide) => {
    if (slideStatusCategory(slide.status) === slideStatusEnum.SCANNING || slideStatusCategory(slide.status) === slideStatusEnum.VIEWER_READY) {
        return null;
    } else {
        return <div>
            <Progress percent={slide.stitcher_percent} type="circle" width={45} className="custom-font-family"/>
        </div>;
    }
}

export const getUploadComponent = (slide, handleUpload, handleDebugUpload) => {

    if (isCloud()) return null;

    var uploadStatus = slide.upload_status;

    var uploadComponent = null;

    if (!hasPermissions([aclPermissions.upload_slide])) {
        return null
    }

    if (slide.isFetching) {
        return getBusyComponent();
    }

    if (slideStatusCategory(slide.status) === slideStatusEnum.VIEWER_READY) {

        let adminMenu = <Menu>
            <Menu.Item>
                <Button onClick={(event) => {
                    event.stopPropagation();
                    handleUpload(slide.morphle_id, slide.id, false, false);
                }}>Upload without Debug</Button>
            </Menu.Item>
            <Menu.Item>
                <Button onClick={(event) => {
                    event.stopPropagation();
                    handleUpload(slide.morphle_id, slide.id, true, false);
                }}>Upload with Debug</Button>
            </Menu.Item>
            <Menu.Item>
                <Button onClick={(event) => {
                    event.stopPropagation();
                    handleDebugUpload(slide.morphle_id, slide.id, true, false);
                }}>Upload Only Debug</Button>
            </Menu.Item>
        </Menu>

        let adminUploadButton = <Dropdown key="admin-upload" overlay={adminMenu} placement="topLeft">
            <UploadOutlined
                key="cloud-upload"
                onClick={(event) => {
                    event.stopPropagation()
                }}
                className="icon-hover slide-icons"/>
        </Dropdown>

        let uploadButton = <Tooltip title="Upload">
            <UploadOutlined
                key="cloud-upload"
                onClick={(event) => {
                    event.stopPropagation();
                    handleUpload(slide.morphle_id, slide.id, false, false);
                }}
                className="icon-hover slide-icons"/>
        </Tooltip>

        if (uploadStatus === slideUploadStatus.NOT_STARTED) {
            uploadComponent = cookie.loadAll().superuser === "true" ? adminUploadButton : uploadButton
        } else if (uploadStatus === 2) {
            uploadComponent = <Tooltip title="Uploaded">
                <CloudSyncOutlined
                    style={{cursor: 'default'}}
                    className="slide-icons"
                    onClick={(event) => {
                        event.stopPropagation();
                    }}/>
            </Tooltip>
        } else if (uploadStatus === slideUploadStatus.ERROR || uploadStatus === slideUploadStatus.LIMIT_BREACH) {
            uploadComponent = <Tooltip title={uploadStatus === slideUploadStatus.LIMIT_BREACH ? "Upload limit reached" : "Upload Error"}>
                <ExclamationCircleTwoTone
                    twoToneColor='red'
                    style={{cursor: 'pointer'}}
                    className="icon-hover slide-icons"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleUpload(slide.morphle_id, slide.id, false, false);
                    }}/>
            </Tooltip>
        } else if (uploadStatus === slideUploadStatus.IN_PROGRESS) {
            if (slide.upload_percent <= 0) {
                uploadComponent = <Tooltip title="Queued for upload">
                    <HourglassOutlined
                        style={{color: "#40a9ff", cursor: 'default'}}
                        className="slide-icons"
                        onClick={(event) => {
                            event.stopPropagation();
                        }}/>
                </Tooltip>
            } else {
                uploadComponent = <CircularProgressWithLabel key={"3"} value={slide.upload_percent}/>
            }
        }
    } else {
        uploadComponent = <div>Scanning</div>
    }

    return uploadComponent;
}

export const getDbEntryComponent = (slide) => {
    if (!isSuperuser()) return null;
    return <Tooltip placement="bottomRight" title="DB Entry">
        <SolutionOutlined
            onClick={(event) => {
                event.stopPropagation();
                let localPath = "/admin/api/slide/" + slide.id + "/change/";
                if (isRunningFromSite()) {
                    window.open(getRealRemoteURL(localPath), '_blank')
                } else {
                    openEndPoint(localPath, true, false);
                }
            }}
            className="icon-hover slide-icons"/>
    </Tooltip>;
}

export const getMorphleIDComponent = (slide) => {
    if (isCloud() || !isSuperuser()) return null;
    let localPath = "app://" + slide.loc_on_machine + "/scans/" + slide.bucket_name + "/" + slide.path;
    return <Tooltip placement="bottomRight" title={slide.morphle_id}>
        <FolderOutlined
            onClick={(event) => {
                event.stopPropagation();
                openEndPoint(localPath, false, false);
            }}
            className="icon-hover slide-icons"/>
    </Tooltip>;
}

export const getExecutableComponent = (slide) => {
    let localPath = "file:///" + slide.loc_on_machine + "/scans/" + slide.bucket_name + "/" + slide.path + "debug/zprofile/plane3d.html";
    console.log(localPath);
    return <Tooltip placement="bottomRight" title={slide.morphle_id}>
        <Icon
            onClick={(event) => {
                event.stopPropagation();
                openEndPoint(localPath, false, false);
            }}
            type="area-chart"
            className="icon-hover slide-icons"
        />
    </Tooltip>;
}

var getBusyComponent = () => {
    let antIcon = <LoadingOutlined style={{fontSize: iconFontSize}} spin/>;
    return <Spin indicator={antIcon}/>
}

export const getTagsComponent = (slide, dispatch, urlState, isMobile = false) => {
    return <div onClick={(e) => e.stopPropagation()} className='tags-forTour'>
        <EditableTagGroup tag={slide.tags}
                          edit={!isMobile}
                          morphle_id={slide.morphle_id}
                          path={slide.path}
                          date={slide.date}
                          specimen_type={slide.specimen_type}
                          slide_id={slide.id}
                          archival_status={slide.archive_status}
        />
    </div>
}

export const getStarredComponent = (slide, handleStarButton) => {
    let icon = <Tooltip placement={"bottomRight"} title={"Bookmark"}>
        <StarFilled
            onClick={(event) => {
                event.stopPropagation();
                handleStarButton(slide, !slide.starred);
            }}
            style={{color: slide.starred === true ? "#f5667b" : ""}}
            className="icon-hover slide-icons"/>
    </Tooltip>
    return slide.isFetching ? getBusyComponent() : icon;
}


export const getDeleteComponent = (slide, handleDelete) => {

    if (!hasPermissions([aclPermissions.delete_slide])) return null

    let icon = <DeleteFilled
        onClick={(event) => event.stopPropagation()}
        style={{textAlign: 'center'}}
        className="icon-hover slide-icons"/>
    return slide.isFetching ? getBusyComponent() : <Popconfirm key={0}
                                                               title="Are you sure delete this slide?"
                                                               onConfirm={(event) => {
                                                                   event.stopPropagation();
                                                                   handleDelete(slide, true);
                                                               }}
                                                               disabled={!hasPermissions([aclPermissions.delete_slide])}
                                                               okText="Yes"
                                                               palcement="topRight"
                                                               style={{padding: 20}}
                                                               cancelText="No"
                                                               onCancel={(event) => {
                                                                   event.stopPropagation();
                                                               }}>
        {icon}
    </Popconfirm>
}


export const getTilingComponent = (slide, dispatch) => {

    if (isCloud()) return null;

    let tilingStatus = slide.tiling_status;

    let tilingComponent = null;

    if (slide.isFetching) {
        return getBusyComponent();
    }

    if (slideStatusCategory(slide.status) === slideStatusEnum.VIEWER_READY) {
        if (cookie.loadAll().superuser === "true") {
            if (tilingStatus === 0) {
                tilingComponent = <Tooltip placement="bottomRight" title="Start Tiling"
                                           className="icon-hover slide-icons"
                                           style={{
                                               display: "flex",
                                               flexDirection: "row",
                                               justifyContent: "center",
                                               alignItems: "center",
                                           }}>
                    <PlayCircleOutlined
                        onClick={(event) => {
                            event.stopPropagation();
                            dispatch(startTiling(slide.morphle_id, slide.id));
                        }}
                        type="build"
                    />
                </Tooltip>
            } else if (tilingStatus === 2) {
                tilingComponent = <Tooltip placement="bottomRight" title="Tiled">
                    <BuildOutlined
                        onClick={(event) => {
                            event.stopPropagation();
                            openEndPoint(`/gamma/${slide.id}?#?tileMapEnable=true&topApp=${tileViewApp.id}`, false, true);
                        }}
                        type="build"
                        className="icon-hover slide-icons"
                    />
                </Tooltip>;
            } else if (tilingStatus === 100) {
                tilingComponent =
                    <div key="2">Error occured while Tiling. Check Jenkins 'raw_tiling'.</div>
            } else if (tilingStatus === 1) {
                tilingComponent = <CircularProgressWithLabel key={"2"} value={slide.tiling_percent}/>
            }
        }
    }
    return tilingComponent;
}

export const getExportComponent = (slide, dispatch) => {

    if (isCloud()) return null;

    let exportStatus = slide.export_status;

    let exportComponent = null;

    if (!hasPermissions([aclPermissions.export_slide])) {
        return null
    }

    if (slide.isFetching) {
        return getBusyComponent();
    }

    if (slideStatusCategory(slide.status) === slideStatusEnum.VIEWER_READY) {

        const exportActionMenu = <Menu>
            {exportStatus === slideExportStatus.QUEUED && <Menu.Item>
                <Button onClick={(event) => {
                    event.stopPropagation();
                    dispatch(prioritizeExport(slide.morphle_id, slide.name, slide.id));
                }}>Prioritize Export</Button>
            </Menu.Item>}
            <Menu.Item>
                <Button onClick={(event) => {
                    event.stopPropagation();
                    dispatch(cancelExport(slide.morphle_id, slide.name, slide.id));
                }}>Cancel Export</Button>
            </Menu.Item>
        </Menu>

        if (exportStatus === slideExportStatus.NOT_DONE) {
            exportComponent = <Tooltip placement="bottomRight" title="Export">
                <ExportOutlined
                    onClick={(event) => {
                        event.stopPropagation();
                        dispatch(startExport(slide.morphle_id, slide.name, slide.id));
                    }}
                    className="icon-hover slide-icons"/>
            </Tooltip>
        } else if (exportStatus === slideExportStatus.QUEUED || exportStatus === slideExportStatus.QUEUED_PRIORITY) {
            exportComponent = <Dropdown key="export-options" overlay={exportActionMenu} placement="topLeft">
                <ClockCircleOutlined
                    style={{
                        cursor: 'default',
                        color: exportStatus === slideExportStatus.QUEUED_PRIORITY ? '#ffc300' : '#1890ff'
                    }}
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                    className="icon-hover slide-icons"/>
            </Dropdown>
        } else if (exportStatus === slideExportStatus.DONE) {
            exportComponent = <Tooltip placement="bottomRight" title="Exported (Click to Redo)">
                <FileDoneOutlined
                    onClick={(event) => {
                        event.stopPropagation();
                        dispatch(startExport(slide.morphle_id, slide.name, slide.id));
                    }}
                    className="icon-hover slide-icons"/>
            </Tooltip>
        } else if (exportStatus >= slideExportStatus.ERROR) {
            exportComponent =
                <Tooltip placement="bottomRight" title="Export Error (Click to retry/Contact morphle support)">
                    <FileExclamationTwoTone
                        twoToneColor='red'
                        onClick={(event) => {
                            event.stopPropagation();
                            dispatch(startExport(slide.morphle_id, slide.name, slide.id));
                        }}
                        className="icon-hover slide-icons"/>
                </Tooltip>
        } else if (exportStatus === slideExportStatus.IN_PROGRESS) {
            exportComponent = <CircularProgressWithLabel key={"2"} value={slide.export_percent}/>
        }
    }

    return exportComponent;
}

/**
 * Get the share component for the slide
 * @param slide - slide object
 * @param dispatch - dispatch function
 * @returns {null}
 */
export const getShareComponent = (slide, dispatch) => {
    let shareComponent = null;
    if ((slideStatusCategory(slide.status) === slideStatusEnum.VIEWER_READY) && hasPermissions([aclPermissions.share_slide])) {
        shareComponent = <Tooltip placement="bottomRight" title="Share">
            <UsergroupAddOutlined
                onClick={(event) => {
                    event.stopPropagation();
                    dispatch(addSlidesToShare(slide.id));
                }}
                className="icon-hover slide-icons"/>
        </Tooltip>
    }

    return shareComponent;
}

export const getObjectiveComponent = (slide, type) => {
    let objectiveComponent = undefined;
    if (slide.objective_type.toLowerCase() === objectiveType.HUNDRED_X.toLowerCase()) {
        objectiveComponent = slide.unread && type === slideViewType.CASEVIEW ? <b>100x</b> : <span>100x</span>;
    } else if (slide.objective_type.toLowerCase() === objectiveType.FORTY_X.toLowerCase()) {
        objectiveComponent = slide.unread && type === slideViewType.CASEVIEW ? <b>40x</b> : <span>40x</span>;
    } else if (slide.objective_type.toLowerCase() === objectiveType.TWENTY_X.toLowerCase()) {
        objectiveComponent = slide.unread && type === slideViewType.CASEVIEW ? <b>20x</b> : <span>20x</span>;
    }
    return objectiveComponent;
}

export const encodeStringWithNewLine = (string) => {
    return string.replace(/\n/g, '&nbnl');
};

export const decodeStringWithNewLine = (string) => {
    return string.replace(/&nbnl/g, '\n');
};

export const getLoadingComponent = () => {
    return <Spin tip="Loading..." /*delay={500}*/>
        <Alert
            message="Your data is loading..."
            description="Please wait..."
            type="info"
        />
    </Spin>
}

export const getErrorComponent = (message = "") => {
    return <Alert
        message="Error"
        description={message.length > 0 ? message : "Some error occured. Please contact admin."}
        type="error"
        showIcon
    />
}

export const assignCaseComponent = (slide, handleAssignCase) => {
    return slide.isFetching ? getBusyComponent() :
        slide.case == null ?
            <Tooltip placement="bottomRight" title="Barcode not detected properly">
                <Button
                    type="danger"
                    onClick={(event) => {
                        event.stopPropagation();
                        handleAssignCase(slide, !slide.barcode_failed);
                    }}
                    ghost
                >
                    <ExclamationCircleOutlined /*theme='filled'*/ style={{ color: 'red', fontSize: '15px' }} />
                    Add to {getCaseNamePlaceholder()}
                </Button>
            </Tooltip> : null;
}

export const getUnauthorizedComponent = (message = "") => {
    return <Alert
        message="Unauthorized"
        description={message.length > 0 ? message : "You are not allowed to view this page. or, try reload page (Ctrl + Shift + R)"}
        type="error"
        showIcon
    />
}

export const getScreenshotCarousel = (screenshots) => {

    const slider = createRef()

    return <Row align={"middle"} justify={"center"}>
        <Col span={1} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '679px',
            cursor: 'pointer'
        }}
             onClick={(e) => {
                 e.stopPropagation();
                 slider.current.prev();
             }}>
            <LeftOutlined/>
        </Col>
        <Col span={22}>
            <Carousel ref={ref => {
                slider.current = ref;
                console.log(ref, slider)
            }}>
                {screenshots.map((screenshot) => {
                    return <div>
                        <img src={screenshot} alt={"Screenshot"} style={{width: '1328px', height: '679px'}}/>
                    </div>
                })}
            </Carousel>
        </Col>
        <Col span={1} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '679px',
            cursor: 'pointer'
        }}
             onClick={(e) => {
                 e.stopPropagation();
                 slider.current.next();
             }}>
            <RightOutlined/>
        </Col>
    </Row>
}

export const getArchiveComponent = (slide) => {
    if (!ArchiveConstants.ACTIVE) return null;
    
    // Check for cloud mode and extract config
    const is_cloud = isCloud();
    const cloud_config = is_cloud && slide.cloud_archival_config ? slide.cloud_archival_config : {};
    const archive_config = cloud_config.archive || {};

    let title, color;
    switch (slide.archive_status) {
        case ArchiveConstants.STATUS.ARCHIVED:
            title = "Slide is archived, click the button to send retrieval request";
            
            // Add permanent deletion info for archived slides when in cloud mode
            if (is_cloud) {
                // Check archive config for glacier permanent deletion setting
                const glacierDeleteDays = archive_config.permanently_delete_archive_data_for_archived_slides_older_than_n_days;

                if (notNull(glacierDeleteDays) && 
                    !isNaN(parseInt(glacierDeleteDays)) && 
                    slide.archival_logs && 
                    slide.archival_logs.length > 0) {
                    
                    try {
                        // Get the date when the slide was archived
                        const archivedDate = getLastArchivedDate(slide.archival_logs);
                        if (archivedDate) {
                            // Calculate permanent deletion date based on archival date
                            const days = parseInt(glacierDeleteDays);
                            const deletionDate = new Date(archivedDate);
                            deletionDate.setDate(deletionDate.getDate() + days);
                            title += `\n(Slide Will be permanently deleted on ${deletionDate.toLocaleDateString()} unless retrieved)`;
                        }
                    } catch (error) {
                        console.error("Error calculating permanent deletion date:", error);
                    }
                }
            }
            
            color = 'yellow';
            break;
        case ArchiveConstants.STATUS.RETRIEVAL_REQUESTED:
            title = "Slide retrieval request is sent";
            color = 'violet';
            break;
        case ArchiveConstants.STATUS.RETRIEVING:
            title = "Slide retrieval in progress";
            color = 'mediumvioletred';
            break;
        case ArchiveConstants.STATUS.RETRIEVED:
            if (is_cloud) {
                const retrieveDays = archive_config.delete_storage_data_n_days_after_retrieval_from_archive;
                
                if (retrieveDays === null) {
                    // Specifically set to null means indefinite retention
                    title = "Slide retrieved — retained indefinitely as configured";
                } else if (notNull(retrieveDays) && !isNaN(parseInt(retrieveDays))) {
                    // Valid number means specific days
                    const days = parseInt(retrieveDays);
                    title = `Slide is retrieved and available till ${getSlideArchivalDate(slide, null, days).toLocaleDateString()}`;
                } else {
                    title = "Slide is retrieved";
                }
            } else {
                const archiveDate = getSlideArchivalDate(slide);
                title = archiveDate ? 
                    `Slide is retrieved and available till ${archiveDate.toLocaleDateString()}` :
                    "Slide is retrieved";
            }
            color = 'blue';
            break;
        default:
            if (is_cloud) {
                const archiveDays = archive_config.enabled ? archive_config.upload_archive_for_slides_older_than_n_days_to_glacier : undefined;
                
                if (notNull(archiveDays) && !isNaN(parseInt(archiveDays))) {
                    // Valid number means specific days
                    const days = parseInt(archiveDays);
                    title = `Available for viewing until archival at ${getSlideArchivalDate(slide, days).toLocaleDateString()}`;
                } else {
                    title = "Available for viewing";
                }
            } else {
                const archiveDate = getSlideArchivalDate(slide);
                title = archiveDate ? 
                    `Available for viewing until archival at ${archiveDate.toLocaleDateString()}` : 
                    "Available for viewing";
            }
            color = 'green';
            break;
    }
    
    // Only show retrieval dropdown if the slide is archived AND not currently being processed
    const canRequestRetrieval = slide.archive_status === ArchiveConstants.STATUS.ARCHIVED && !slide.isFetching;

    // Create the retrieval menu/dropdown
    const retrieve_menu = <Menu>
        <Menu.Item disabled={slide.isFetching}>
            <Button 
                disabled={slide.isFetching}
                onClick={() => {
                    store.dispatch(requestSlideRetrieval(slide));
                }}>
                {slide.isFetching ? "Processing..." : "Retrieve Slide"}
            </Button>
        </Menu.Item>
    </Menu>;

    return slide.archive_status === ArchiveConstants.STATUS.ARCHIVED ?
        <Dropdown key="retrieve-slide" overlay={retrieve_menu} placement="bottomCenter">
            <Tooltip title={title}>
                <FaCircle style={{color, marginTop: '7px'}}/>
            </Tooltip>
        </Dropdown> :
        <Tooltip title={title}>
            <FaCircle style={{color, marginTop: '7px'}}/>
        </Tooltip>;
}

export const customizeRenderEmpty = () => (
    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={"No slides found for given filter."}></Empty>
);