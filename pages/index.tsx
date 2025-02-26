import Head from 'next/head'
import { ChangeEvent, useEffect, useState } from 'react'
import configJson from '../config/2023/config.json'
import {
  Config,
  InputProps,
  SectionProps,
} from '../components/inputs/BaseInputProps'
import QRModal from '../components/QRModal'
import Section from '../components/Section'
import Button, { Variant } from '../components/core/Button'
import Modal from 'react-bootstrap/Modal'
import { Scanner, outline, useDevices } from '@yudiel/react-qr-scanner'

function buildConfig(c: Config) {
  let config: Config = { ...c }
  config.sections
    .map((s) => s.fields)
    .flat()
    .forEach((f) => (f.value = f.defaultValue))
  return config
}

function getDefaultConfig(): Config {
  return buildConfig(configJson as Config)
}

function createMetadataSection(
  basic: string,
  scouter: string | null = null,
  matchNumber: number | null = null,
  robot: string | null = null,
  teamNumber1: number | null = null,
  teamNumber2: number | null = null,
  teamNumber3: number | null = null
): SectionProps {
  return {
    name: 'Metadata',
    preserveDataOnReset: true,
    fields: [
       {
        title: 'Data Type',
        type: 'select',
        required: true,
        code: 'basic',
        choices: {
          S: 'Subjective',
        },
        defaultValue: 'S',
        value: basic,
        disabled: basic != null,
      },
      {
        title: 'Scouter ID',
        type: 'text',
        required: true,
        code: 'scouter',
        value: scouter,
        disabled: scouter != '',
      },
      {
        title: 'Match Number',
        type: 'number',
        required: true,
        min: 0,
        code: 'matchNumber',
        value: matchNumber,
        disabled: matchNumber != null,
      },
      {
        title: 'Alliance',
        type: 'select',
        required: true,
        code: 'robot',
        choices: {
          R: 'Red',
          B: 'Blue',
        },
        defaultValue: 'R',
        value: robot,
        disabled: robot != null,
      },
      {
        title: 'Team Number One',
        type: 'number',
        required: true,
        min: 0,
        code: 'teamNumber1',
        value: teamNumber1,
        disabled: teamNumber1 != null,
      },
       {
        title: 'Team Number Two',
        type: 'number',
        required: true,
        min: 0,
        code: 'teamNumber2',
        value: teamNumber2,
        disabled: teamNumber2 != null,
      },
       {
        title: 'Team Number Three',
        type: 'number',
        required: true,
        min: 0,
        code: 'teamNumber3',
        value: teamNumber3,
        disabled: teamNumber3 != null,
      },
    ],
  }
}

interface LeaderData {
  scouter: string
  basic: string
  name: string
  matchNumber: number
  teamNumber1: number
  teamNumber2: number
  teamNumber3: number
  fmsRobot: string
}

export default function Home() {
  const [formData, setFormData] = useState(getDefaultConfig())
  const [showQR, setShowQR] = useState(false)

  const [showScanFromLeader, setShowScanFromLeader] = useState(true)
  const [showScanConfirmation, setShowScanConfirmation] = useState(false)
  const [deviceId, setDeviceId] = useState<string | undefined>(undefined)
  const [devices, setDevices] = useState(useDevices())
  const refreshDevices = () =>
    (async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices()
        const devices = mediaDevices.filter(({ kind }) => kind === 'videoinput')
        if (devices.length > 0) {
          setDevices(devices)
        }
      } catch (e) {
        console.error(e)
      }
    })()
  const [leaderData, setLeaderData] = useState<LeaderData | null>(null)

  useEffect(() => {
    let userConfig = localStorage.getItem('QRScoutUserConfig')
    if (userConfig) {
      setFormData(buildConfig(JSON.parse(userConfig) as Config))
    } else {
      setFormData(getDefaultConfig())
    }
  }, [])

  function updateValue(sectionName: string, code: string, data: any) {
    const currentData = { ...formData }
    let section = currentData.sections.find((s) => s.name === sectionName)
    if (section) {
      let field = section.fields.find((f) => f.code === code)
      if (field) {
        field.value = data
      } else {
        console.error("Couldn't find field " + code)
      }
    } else {
      console.error("Couldn't find section " + sectionName)
    }
    setFormData(currentData)
  }

  function getMissingRequiredFields(): InputProps[] {
    return formData.sections
      .map((s) => s.fields)
      .flat()
      .filter(
        (f) =>
          f.required &&
          (f.value === null || f.value === undefined || f.value === ``)
      )
  }

  function getFieldValue(code: string): any {
    return formData.sections
      .map((s) => s.fields)
      .flat()
      .find((f) => f.code === code)?.value
  }

  function resetSections() {
    const currentData = { ...formData }

    currentData.sections
      .filter((s) => !s.preserveDataOnReset)
      .map((s) => s.fields)
      .flat()
      .forEach((f) => {
        console.log(`resetting ${f.title} from ${f.value} to ${f.defaultValue}`)
        f.value = f.defaultValue
      })

    setFormData(currentData)
  }

  function getQRCodeData(): string {
    return formData.sections
      .map((s) => s.fields)
      .flat()
      .map((v) => `${v.value}`)
      .join('\t')
  }

  function download(filename: string, text: string) {
    var element = document.createElement('a')
    element.setAttribute(
      'href',
      'data:text/plain;charset=utf-8,' + encodeURIComponent(text)
    )
    element.setAttribute('download', filename)

    element.style.display = 'none'
    document.body.appendChild(element)

    element.click()

    document.body.removeChild(element)
  }

  function downloadConfig() {
    const configDownload = { ...formData }

    configDownload.sections.forEach((s) =>
      s.fields.forEach((f) => (f.value = undefined))
    )
    download('QRScout_config.json', JSON.stringify(configDownload))
  }

  function handleFileChange(evt: ChangeEvent<HTMLInputElement>) {
    var reader = new FileReader()
    reader.onload = function (e) {
      const configText = e.target?.result as string
      localStorage.setItem('QRScoutUserConfig', configText)
      const jsonData = JSON.parse(configText)
      setFormData(buildConfig(jsonData as Config))
    }
    if (evt.target.files && evt.target.files.length > 0) {
      reader.readAsText(evt.target.files[0])
    }
  }

  return (
    <div className="min-h-screen py-2">
      <Head>
        <title>{formData.title}</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 text-center">
        <h1 className="font-sans text-6xl font-bold">
          <div className="text-red-600">{formData.page_title}</div>
        </h1>
        <QRModal
          show={showQR}
          title={`${getFieldValue('robot')} - ${getFieldValue('matchNumber')}`}
          data={getQRCodeData()}
          onDismiss={() => setShowQR(false)}
        />

        <form>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {formData.sections.map((section) => {
              return (
                <Section
                  key={section.name}
                  name={section.name}
                  inputs={section.fields}
                  onValueChanged={updateValue}
                />
              )
            })}

            <div className="mb-4 flex flex-col justify-center rounded bg-white shadow-md">
              <button
                className="focus:shadow-outline mx-2 rounded bg-gray-700 py-6 px-6 font-bold uppercase text-white hover:bg-gray-700 focus:shadow-lg focus:outline-none disabled:bg-gray-300"
                type="button"
                onClick={() => setShowQR(true)}
                disabled={getMissingRequiredFields().length > 0}
              >
                Commit
              </button>
              <button
                className="focus:shadow-outline mx-2 my-6 rounded border border-red-400 bg-white py-2 font-bold text-red-400 hover:bg-red-200 focus:outline-none"
                type="button"
                onClick={() => resetSections()}
              >
                Reset
              </button>
            </div>
            <div className="mb-4 flex flex-col justify-center rounded bg-white shadow-md">
              <Button
                variant={Variant.Secondary}
                className="m-2"
                onClick={() =>
                  navigator.clipboard.writeText(
                    formData.sections
                      .map((s) => s.fields)
                      .flat()
                      .map((f) => f.title)
                      .join('\t')
                  )
                }
              >
                Copy Column Names
              </Button>
              <Button
                variant={Variant.Secondary}
                className="m-2"
                onClick={() => downloadConfig()}
              >
                Download Config
              </Button>
              <label className="m-2 flex cursor-pointer flex-row justify-center rounded border bg-gray-500 py-2 text-center font-bold text-white hover:bg-gray-600">
                <span className="text-base leading-normal">Upload Config</span>
                <input
                  type="file"
                  className="hidden"
                  accept=".json"
                  onChange={(e) => handleFileChange(e)}
                />
              </label>
            </div>
          </div>
        </form>
      </main>
      <footer>
        <div className="flex items-center justify-center">
          <a
            href="https://vercel.com/?utm_source=iraiders&utm_campaign=oss"
            target="_blank"
          >
            <img src="https://www.datocms-assets.com/31049/1618983297-powered-by-vercel.svg"></img>
          </a>
        </div>
      </footer>

      <Modal show={showScanFromLeader}>
        <Modal.Header>
          <Modal.Title>Scan from leader</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Please scan the QR code provided by the scouting leader.</p>
          <select onChange={(e) => setDeviceId(e.target.value)}>
            <option value={undefined}>Select camera</option>
            {devices.map((device, index) => (
              <option key={index} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
          <Button variant={Variant.Primary} onClick={refreshDevices}>
            Refresh cameras
          </Button>
          <Scanner
            onScan={(detectedCodes) => {
              if (
                showScanConfirmation ||
                !showScanFromLeader ||
                leaderData != null
              )
                return
              for (const code of detectedCodes) {
                try {
                  const newLeaderData = JSON.parse(code.rawValue) as LeaderData
                  if (
                    
                    'basic' in newLeaderData &&
                    'scouter' in newLeaderData &&
                    'matchNumber' in newLeaderData &&
                    'teamNumber1' in newLeaderData &&
                    'teamNumber2' in newLeaderData &&
                    'teamNumber3' in newLeaderData &&
                    'fmsRobot' in newLeaderData
                  ) {
                    if (
                      showScanConfirmation ||
                      !showScanFromLeader ||
                      leaderData != null
                    )
                      break
                    setLeaderData(newLeaderData)
                    setShowScanConfirmation(true)
                    break
                  }
                } catch (e) {}
              }
            }}
            constraints={{
              deviceId,
            }}
            components={{
              tracker: outline,
              finder: false,
              audio: false,
            }}
            paused={!showScanFromLeader}
            allowMultiple={true}
            scanDelay={500}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant={Variant.Danger}
            onClick={() => {
              setShowScanFromLeader(false)

              const newData = { ...formData }
              newData.sections = [
                createMetadataSection(),
                ...formData.sections.filter(
                  (section) => section.name != 'Metadata'
                ),
              ]
              setFormData(newData)
            }}
          >
            Manual scouting
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showScanConfirmation && showScanFromLeader}>
        <Modal.Header>
          <Modal.Title>Is this correct?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Basic: {leaderData.basic}</p>
          <p>Name: {leaderData?.name}</p>
          <p>Scouter: {leaderData?.scouter}</p>
          <p>Match Number: {leaderData?.matchNumber}</p>
          <p>Team Number 1: {leaderData?.teamNumber1}</p>
          <p>Team Number 2: {leaderData?.teamNumber2}</p>
          <p>Team Number 3: {leaderData?.teamNumber3}</p>
          <p>Robot: {leaderData?.fmsRobot}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant={Variant.Primary}
            onClick={() => {
              setShowScanConfirmation(false)
              // Sometimes this modal can show when the scan from leader modal is not showing. Ignore button presses if this happens
              if (!showScanFromLeader) {
                console.log("ignoring yes")
                return
              }
              setShowScanFromLeader(false)

              let robot = ''
              if (leaderData?.fmsRobot.toLowerCase().includes('red')) {
                robot += 'r'
              } else {
                robot += 'b'
              }
              if (leaderData?.fmsRobot.toLowerCase().includes('1')) {
                robot += '1'
              } else if (leaderData?.fmsRobot.toLowerCase().includes('2')) {
                robot += '2'
              } else {
                robot += '3'
              }

              const newData = { ...formData }
              newData.sections = [
                createMetadataSection(
                  leaderData?.basic,
                  leaderData?.scouter,
                  leaderData?.name,
                  leaderData?.matchNumber,
                  leaderData?.fmsRobot,
                  leaderData?.teamNumber1,
                  leaderData?.teamNumber2,
                  leaderData?.teamNumber3,
                ),
                ...formData.sections.filter(
                  (section) => section.name != 'Metadata'
                ),
              ]
              setFormData(newData)
            }}
          >
            Yes
          </Button>
          <Button
            variant={Variant.Secondary}
            onClick={() => {
              setShowScanConfirmation(false)
              // Sometimes this modal can show when the scan from leader modal is not showing. Ignore button presses if this happens
              if (!showScanFromLeader)  {
                console.log("ignoring no")
                return
              }
              setLeaderData(null)
            }}
          >
            No
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
