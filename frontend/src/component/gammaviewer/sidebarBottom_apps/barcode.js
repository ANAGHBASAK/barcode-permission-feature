import React, {Component} from "react";
import {connect} from "react-redux";
import {Stack, Tooltip} from "@mui/material";
import {getBarcodeUrl, isCloud, notNull} from "../../../utils/utils";
import {mapSlideToProps} from "../../../redux_reducers/utils";
import {updateBarcodeImgRotation} from "../../../redux_actions/screenshot.state.action"
import {defaultBarcode, Loader} from "utils/const";
import {getDicomThumbnails, getGlobalConfig, setGlobalConfig} from "../../../utils/api";
import {GLOBAL_CONFIG} from "../../../utils/enums";
import {notifyError} from "../utils/display.notification";
import {error_manager} from "../../../helper/error_manager";
// FEATURE: Barcode Permission Control - import
import {aclPermissions, hasPermissions} from "../../../const/ACLPermissions";
// END FEATURE

class Barcode extends Component {
    constructor(props) {
        super(props);
        this.state = {
            imageData: null,
            isBarcodeErrored: false,
            isFetchingBarcode: true,
        }
    }

    componentDidMount() {
        this.getData()
        this.getBarcodeUrl()
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.loadingState.loading && !this.props.loadingState.loading) {
            this.getBarcodeUrl();
        }
    }

    getData = () => {
        getGlobalConfig().then(response => {
            if (response.status === 200) {
                if (notNull(response.data[GLOBAL_CONFIG.BARCODE_ROTATION_VIEWER.key])) {
                    this.props.dispatch(updateBarcodeImgRotation(response.data[GLOBAL_CONFIG.BARCODE_ROTATION_VIEWER.key]))
                } else {
                    this.props.dispatch(updateBarcodeImgRotation(270))
                    this.setData(GLOBAL_CONFIG.BARCODE_ROTATION_VIEWER.key, 270)
                }
            }
        }).catch(err => error_manager("Failed to fetch key", err))
    }

    getBarcodeUrl = () => {
        if(!this.props.loadingState.loading){
            if (this.props.is_dicom) {
                getDicomThumbnails(this.props.slide.id, true)
                    .then(data => this.setState({imageData: data, isFetchingBarcode: false}))
                    .catch(_ => this.setState({imageData: '', isFetchingBarcode: false}))
            }else{
                let barcodeUrl= getBarcodeUrl(this.props.slide, isCloud())
                this.setState({
                    imageData: barcodeUrl,
                    isFetchingBarcode: false,
                })
            }
        }
    }

    setData = (key, value) => {
        setGlobalConfig(key, value).then(res => {
            if (res.status !== 200) {
                notifyError('barcode', `Error in setting ${key}`)
            }
        }).catch(err => error_manager("Failed to set key", err))
    };

    rotate = () => {
        let rotation = this.props.barcodeImgCurrentRotation
        rotation = (rotation + 90) % 360
        this.props.dispatch(updateBarcodeImgRotation(rotation))
        this.setData(GLOBAL_CONFIG.BARCODE_ROTATION_VIEWER.key, rotation)
    }

    render() {
        // FEATURE: Barcode Permission Control
        // Hide barcode component if user doesn't have barcode_app permission
        if (!hasPermissions([aclPermissions.barcode_app])) {
            return null;
        }
        // END FEATURE

        return <Stack width={"100%"} height={"100%"} justifyContent={"center"} alignItems={"center"}>
            <Tooltip title={this.state.isBarcodeErrored ? "" : "Click to Rotate 90"}>
                {(this.props.loadingState.loading || this.state.isFetchingBarcode) ? <Loader/> : <img id='barcode-img' alt={'barcode'}
                                                                    src={this.state.imageData}
                                                                    onError={({event, currentTarget}) => {
                                                                        if (currentTarget) {
                                                                            this.setState({isBarcodeErrored: true})
                                                                            currentTarget.src = defaultBarcode;
                                                                        }
                                                                        if (event?.currentTarget) event.currentTarget.onerror = null; // prevents looping
                                                                    }}
                                                                    style={{
                                                                        height: '220px',
                                                                        width: 'auto',
                                                                        cursor: this.state.isBarcodeErrored ? 'auto' : 'pointer',
                                                                        transformOrigin: "50% 50%",
                                                                        transform: this.state.isBarcodeErrored ? `rotate(${270}deg)` : `rotate(${this.props.barcodeImgCurrentRotation}deg)`
                                                                    }}
                                                                    onClick={this.state.isBarcodeErrored ? null : this.rotate}
                />}
            </Tooltip>
        </Stack>
    }
}

const mapAdditionalStateToProps = (mapSlideToProps) => (state) => {
    const props = mapSlideToProps(state);
    const barcodeImgCurrentRotation = state.screenshotStateReducer.barcodeImgCurrentRotation;
  
    return {
      ...props,
      barcodeImgCurrentRotation,
    };
  };

export default connect(mapAdditionalStateToProps(mapSlideToProps))(Barcode);
